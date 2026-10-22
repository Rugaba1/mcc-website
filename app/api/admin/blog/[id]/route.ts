import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";
import { postData, uniquePostSlug } from "@/lib/blog/payload";
import { checkMdx } from "@/lib/blog/validate";
import { toSummary } from "../route";

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

export async function GET(req: NextRequest, { params }: Ctx) {
  const { error } = await requireStaff(req);
  if (error) return error;
  const id = Number((await params).id);
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  return post
    ? NextResponse.json(detail(post))
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { error } = await requireStaff(req);
    if (error) return error;
    const id = Number((await params).id);
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const data = postData(body);
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
        slug: await uniquePostSlug(body.slug || data.title, id),
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
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { error } = await requireStaff(req);
    if (error) return error;
    await prisma.blogPost.delete({ where: { id: Number((await params).id) } });
    refresh();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/blog/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
