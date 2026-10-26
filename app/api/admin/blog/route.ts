import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { parseBlogPostPayload, postData, uniquePostSlug } from "@/lib/blog/payload";
import { checkMdx } from "@/lib/blog/validate";
import { toSummary } from "@/lib/blog/summary";

export const GET = withPermission(PERM.BLOG_VIEW)(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(parseInt(sp.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(sp.get("limit") ?? "15", 10) || 15, 1),
      60,
    );
    const q = sp.get("q")?.trim();
    const status = sp.get("status");

    const where: Prisma.BlogPostWhereInput = {
      ...(status &&
        ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status) && {
          status: status as any,
        }),
      ...(q && {
        OR: [
          { title: { contains: q } },
          { slug: { contains: q } },
          { tags: { contains: q } },
        ],
      }),
    };
    const [total, rows] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
    ]);
    return NextResponse.json({
      posts: rows.map(toSummary),
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("GET /api/admin/blog error:", err);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
});

export const POST = withPermission(PERM.BLOG_WRITE)(
  async (req: NextRequest, { user }) => {
  try {
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

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        slug: await uniquePostSlug(
          payload.slug ?? data.title,
        ),
        authorId: user.id,
      },
    });
    revalidatePath("/[locale]/blog", "page");
    return NextResponse.json(
      { ...post, tags: post.tags?.split(",") ?? [] },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/admin/blog error:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
  },
);
