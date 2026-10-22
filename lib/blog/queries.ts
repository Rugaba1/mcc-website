import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export const BLOG_PAGE_SIZE = 9;

const listSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  coverAlt: true,
  tags: true,
  readingMinutes: true,
  publishedAt: true,
  featured: true,
  locale: true,
  author: { select: { firstName: true, lastName: true, profilePicture: true } },
} satisfies Prisma.BlogPostSelect;

export async function getPublishedPosts(opts: {
  page: number;
  limit?: number;
  locale?: string;
  tag?: string;
  q?: string;
}) {
  const limit = opts.limit ?? BLOG_PAGE_SIZE;
  const where: Prisma.BlogPostWhereInput = {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    ...(opts.locale && { locale: opts.locale }),
    ...(opts.tag && { tags: { contains: opts.tag } }),
    ...(opts.q && {
      OR: [{ title: { contains: opts.q } }, { excerpt: { contains: opts.q } }],
    }),
  };
  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      select: listSelect,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: (opts.page - 1) * limit,
    }),
  ]);
  return { posts, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export const getPostBySlug = (slug: string) =>
  prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
          jobTitle: true,
        },
      },
    },
  });
