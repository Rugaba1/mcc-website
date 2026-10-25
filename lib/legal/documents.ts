import type { LegalDocumentType } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { LEGAL_DOCUMENTS, legalDocumentFromSlug } from "./constants";

export { LEGAL_DOCUMENTS, legalDocumentFromSlug };

export function getLocalizedLegalContent<
  T extends {
    title: string;
    titleFr: string;
    titleRw: string;
    contentMarkdown: string;
    contentMarkdownFr: string;
    contentMarkdownRw: string;
  },
>(document: T, locale: string) {
  if (locale === "fr") {
    return {
      title: document.titleFr,
      contentMarkdown: document.contentMarkdownFr,
    };
  }
  if (locale === "rw") {
    return {
      title: document.titleRw,
      contentMarkdown: document.contentMarkdownRw,
    };
  }
  return {
    title: document.title,
    contentMarkdown: document.contentMarkdown,
  };
}

export async function getPublishedLegalDocuments() {
  const versions = await Promise.all(
    LEGAL_DOCUMENTS.map(({ type }) =>
      prisma.legalDocumentVersion.findFirst({
        where: { documentType: type, publishedAt: { not: null } },
        orderBy: { version: "desc" },
      }),
    ),
  );
  return new Map(
    versions.flatMap((version) => version ? [[version.documentType, version] as const] : []),
  );
}

export async function getPendingLegalDocuments(userId: number) {
  const currentVersions = await Promise.all(
    LEGAL_DOCUMENTS.map(({ type }) =>
      prisma.legalDocumentVersion.findFirst({
        where: { documentType: type, publishedAt: { not: null } },
        orderBy: { version: "desc" },
        select: { id: true, documentType: true, version: true },
      }),
    ),
  ).then((versions) => versions.filter((version) => version !== null));
  const accepted = await prisma.legalAcceptance.findMany({
    where: {
      userId,
      legalVersionId: { in: currentVersions.map(({ id }) => id) },
    },
    select: { legalVersionId: true },
  });
  const acceptedIds = new Set(accepted.map(({ legalVersionId }) => legalVersionId));
  return {
    currentVersions,
    pendingVersions: currentVersions.filter(({ id }) => !acceptedIds.has(id)),
  };
}
