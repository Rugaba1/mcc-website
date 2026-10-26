import { z } from "zod";
import { LegalDocumentType } from "@/lib/generated/prisma/client";

export const legalDraftSchema = z.object({
  documentType: z.nativeEnum(LegalDocumentType),
  title: z.string().trim().max(255).default(""),
  titleFr: z.string().trim().max(255).default(""),
  titleRw: z.string().trim().max(255).default(""),
  contentMarkdown: z.string().max(100_000).default(""),
  contentMarkdownFr: z.string().max(100_000).default(""),
  contentMarkdownRw: z.string().max(100_000).default(""),
}).strict();

export const legalDraftUpdateSchema = legalDraftSchema
  .omit({ documentType: true })
  .strict();

export type LegalDraftContent = z.infer<typeof legalDraftUpdateSchema>;
