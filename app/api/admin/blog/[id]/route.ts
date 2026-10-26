import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { parseBlogPostPayload, postData, uniquePostSlug } from "@/lib/blog/payload";
import { checkMdx } from "@/lib/blog/validate";
import { toSummary } from "@/lib/blog/summary";

type Ctx = { params: Promise<{ id: string }> };
const detail = (p: any) => ({
  ...toSummary(p),
  content: p.content,
  coverAlt: p.coverAlt,
  tags: p.tags ? p.tags.split(",") : [],
  seoTitle: p.seoTitle,
  seoDescription: p.seoDescription,
});
const refresh = () => {
  revalidatePath("/[locale]/blog", "page");
  revalidatePath("/[locale]/blog/[slug]", "page");
};

export const GET = withPermission(PERM.BLOG_VIEW)(async (req, context) => {
  const id = Number((await context.params!).id);
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  return post
    ? NextResponse.json(detail(post))
    : NextResponse.json({ error: "Not found" }, { status: 404 });
});

export const PUT = withPermission([PERM.BLOG_WRITE, PERM.BLOG_EDIT_ANY])(
  async (req, context) => {
  try {
    const id = Number((await context.params!).id);
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }
    const payload = parseBlogPostPayload(body);
    if (!payload) {
      return NextResponse.json(
        { error: "Blog post body must be a JSON object" },
        { status: 400 },
      );
    }
    const data = postData(payload);
    if (!data.title || !data.content)
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 },
      );
    const mdxError = await checkMdx(data.content);
    if (mdxError)
      return NextResponse.json({ error: mdxError }, { status: 400 });

    // keep the original publish date across edits
    const publishedAt =
      data.status === "PUBLISHED"
        ? (existing.publishedAt ?? data.publishedAt ?? new Date())
        : existing.publishedAt;

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt,
        slug: await uniquePostSlug(
          payload.slug ?? data.title,
          id,
        ),
      },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    refresh();
    return NextResponse.json(detail(post));
  } catch (err) {
    console.error("PUT /api/admin/blog/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
  },
);

export const DELETE = withPermission(PERM.BLOG_DELETE)(
  async (req, context) => {
  try {
    await prisma.blogPost.delete({
      where: { id: Number((await context.params!).id) },
    });
    refresh();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/blog/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
  },
);
