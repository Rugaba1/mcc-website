import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";
import { getPublishedPosts } from "@/lib/blog/queries";
import { postData, uniquePostSlug } from "@/lib/blog/payload";

const clean = (v: string | null) => {
  const t = v?.trim();
  return !t || ["undefined", "null", "all"].includes(t) ? undefined : t;
};

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(parseInt(clean(sp.get("page")) ?? "1", 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(clean(sp.get("limit")) ?? "9", 10) || 9, 1),
      60,
    );
    const data = await getPublishedPosts({
      page,
      limit,
      locale: clean(sp.get("locale")),
      tag: clean(sp.get("tag")),
      q: clean(sp.get("search")),
    });
    return NextResponse.json({ ...data, page });
  } catch (err) {
    console.error("GET /api/blog error:", err);
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
        { error: "title and content are required" },
        { status: 400 },
      );
    const post = await prisma.blogPost.create({
      data: {
        ...data,
        slug: await uniquePostSlug(body.slug || data.title),
        authorId: user?.id ?? null,
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("POST /api/blog error:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
