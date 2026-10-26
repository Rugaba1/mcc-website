import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublishedPosts } from "@/lib/blog/queries";
import { parseBlogPostPayload, postData, uniquePostSlug } from "@/lib/blog/payload";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
 

const clean = (v: string | null) => {
  const t = v?.trim();
  return !t || ["undefined", "null", "all"].includes(t) ? undefined : t;
};

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (req: NextRequest) => {
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
});

export const POST = withPermission(PERM.BLOG_WRITE)(async (req, { user }) => {
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
        { error: "Blog post body must be a JSON object with valid fields" },
        { status: 400 },
      );
    }
    const data = postData(payload);
    if (!data.title || !data.content.trim()) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 },
      );
    }
    const post = await prisma.blogPost.create({
      data: {
        ...data,
        slug: await uniquePostSlug(payload.slug || data.title),
        authorId: user.id,
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
});
