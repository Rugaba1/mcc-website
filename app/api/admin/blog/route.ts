import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { requireStaff } from "@/lib/auth/require-staff";
import { postData, uniquePostSlug } from "@/lib/blog/payload";
import { checkMdx } from "@/lib/blog/validate";

export const toSummary = (p: any) => ({
  id: p.id,
  slug: p.slug,
  locale: p.locale,
  title: p.title,
  excerpt: p.excerpt,
  coverImage: p.coverImage,
  status: p.status,
  featured: p.featured,
  readingMinutes: p.readingMinutes,
  publishedAt: p.publishedAt,
  updatedAt: p.updatedAt,
  authorName: p.author
    ? [p.author.firstName, p.author.lastName].filter(Boolean).join(" ")
    : null,
});

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireStaff(req);
    if (error) return error;
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
}

export async function POST(req: NextRequest) {
  try {
    const { error, user } = (await requireStaff(req)) as any;
    if (error) return error;
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

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        slug: await uniquePostSlug(body.slug || data.title),
        authorId: user?.id ?? null,
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
}
