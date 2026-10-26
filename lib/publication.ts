import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const publicationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).default(""),
  contentMarkdown: z.string().max(100_000).default(""),
  coverImage: z.string().trim().max(5_000).nullable().default(null),
  fileUrl: z.string().trim().max(5_000).nullable().default(null),
  placement: z.enum([
    "NAVBAR",
    "HOME_DIALOG",
    "PUBLIC_PAGE",
    "NAVBAR_AND_PAGE",
    "DIALOG_AND_PAGE",
  ]),
  active: z.boolean().default(false),
  startsAt: z.string().datetime().nullable().default(null),
  endsAt: z.string().datetime().nullable().default(null),
}).strict().refine(
  (value) =>
    !value.startsAt || !value.endsAt ||
    new Date(value.startsAt) < new Date(value.endsAt),
  { message: "The end date must be after the start date.", path: ["endsAt"] },
);

export async function uniquePublicationSlug(title: string) {
  const base =
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 180) || "publication";
  let slug = base;
  let suffix = 1;
  while (await prisma.publication.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${++suffix}`;
  }
  return slug;
}

export function publicationData(
  value: z.infer<typeof publicationSchema>,
  slug: string,
) {
  return {
    slug,
    title: value.title,
    summary: value.summary,
    contentMarkdown: value.contentMarkdown,
    coverImage: value.coverImage || null,
    fileUrl: value.fileUrl || null,
    placement: value.placement,
    active: value.active,
    startsAt: value.startsAt ? new Date(value.startsAt) : null,
    endsAt: value.endsAt ? new Date(value.endsAt) : null,
  };
}
