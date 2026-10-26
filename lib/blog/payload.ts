import readingTime from "reading-time";
import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { BlogStatus } from "@/lib/api";
import { slugify } from "./slug";

const blogPostPayloadSchema = z
  .object({
    title: z.string().optional(),
    locale: z.string().optional(),
    excerpt: z.string().nullable().optional(),
    content: z.string().optional(),
    coverImage: z.string().nullable().optional(),
    coverAlt: z.string().nullable().optional(),
    tags: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    featured: z.boolean().optional(),
    seoTitle: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    publishedAt: z
      .string()
      .nullable()
      .optional()
      .refine(
        (value) => value === undefined || value === null || Number.isFinite(Date.parse(value)),
      ),
    slug: z.string().optional(),
  })
  .passthrough();

export type BlogPostPayload = z.infer<typeof blogPostPayloadSchema>;

type BlogPostWriteData = Pick<
  Prisma.BlogPostUncheckedCreateInput,
  | "title"
  | "locale"
  | "excerpt"
  | "content"
  | "coverImage"
  | "coverAlt"
  | "tags"
  | "featured"
  | "seoTitle"
  | "seoDescription"
  | "status"
  | "readingMinutes"
> & {
  publishedAt: Date | null;
};

export function parseBlogPostPayload(value: unknown): BlogPostPayload | null {
  const parsed = blogPostPayloadSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function isBlogPostPayload(
  value: unknown,
): value is BlogPostPayload {
  return blogPostPayloadSchema.safeParse(value).success;
}

export async function uniquePostSlug(base: string, ignoreId?: number) {
  const { prisma } = await import("@/lib/prisma");
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

export function postData(body: BlogPostPayload): BlogPostWriteData {
  const content = body.content ?? "";
  const status: BlogStatus = body.status ?? "DRAFT";
  const requestedPublishedAt = body.publishedAt
    ? new Date(body.publishedAt)
    : null;
  return {
    title: (body.title ?? "").trim(),
    locale: body.locale?.trim() || "en",
    excerpt: body.excerpt?.trim() || null,
    content,
    coverImage: body.coverImage?.trim() || null,
    coverAlt: body.coverAlt?.trim() || null,
    tags: Array.isArray(body.tags)
      ? body.tags.join(",")
      : body.tags?.trim() || null,
    featured: body.featured === true,
    seoTitle: body.seoTitle?.trim() || null,
    seoDescription: body.seoDescription?.trim() || null,
    status,
    readingMinutes: Math.max(1, Math.ceil(readingTime(content).minutes)),
    publishedAt:
      status === "PUBLISHED"
        ? requestedPublishedAt ?? new Date()
        : null,
  };
}
