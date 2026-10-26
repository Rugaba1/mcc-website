import type { Prisma } from "@/lib/generated/prisma/client";

type BlogPostWithAuthor = Prisma.BlogPostGetPayload<{
  include: { author: { select: { firstName: true; lastName: true } } };
}>;

export const toSummary = (post: BlogPostWithAuthor) => {
  const authorName = post.author
    ? [post.author.firstName, post.author.lastName].filter(Boolean).join(" ").trim()
    : "";

  return {
    id: post.id,
    slug: post.slug,
    locale: post.locale,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    status: post.status,
    featured: post.featured,
    readingMinutes: post.readingMinutes,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    authorName: authorName || "MCC Editorial Team",
  };
};
