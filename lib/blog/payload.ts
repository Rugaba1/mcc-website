import readingTime from "reading-time";
import { prisma } from "@/lib/prisma";
import { slugify } from "./slug";

 

export async function uniquePostSlug(base: string, ignoreId?: number) {
  const root = slugify(base) || "post";
  let slug = root,
    i = 1;
  while (
    await prisma.blogPost.findFirst({
      where: { slug, ...(ignoreId && { NOT: { id: ignoreId } }) },
      select: { id: true },
    })
  )
    slug = `${root}-${++i}`;
  return slug;
}

export function postData(body: any) {
  const content = String(body.content ?? "");
  const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(body.status)
    ? body.status
    : "DRAFT";
  return {
    title: String(body.title ?? "").trim(),
    locale: body.locale || "en",
    excerpt: body.excerpt || null,
    content,
    coverImage: body.coverImage || null,
    coverAlt: body.coverAlt || null,
    tags: Array.isArray(body.tags) ? body.tags.join(",") : body.tags || null,
    featured: !!body.featured,
    seoTitle: body.seoTitle || null,
    seoDescription: body.seoDescription || null,
    status,
    readingMinutes: Math.max(1, Math.ceil(readingTime(content).minutes)),
    publishedAt:
      status === "PUBLISHED"
        ? body.publishedAt
          ? new Date(body.publishedAt)
          : new Date()
        : null,
  };
}
