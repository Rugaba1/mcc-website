import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { getLocalizedLegalContent, getPendingLegalDocuments } from "@/lib/legal/documents";
import { prisma } from "@/lib/prisma";

const acceptanceSchema = z.object({
  legalVersionIds: z.array(z.number().int().positive()).min(1).max(3),
}).strict();

export const GET = withAuth(async (_request, { user, locale }) => {
  const { currentVersions, pendingVersions } = await getPendingLegalDocuments(user.id);
  const pendingDocuments = await prisma.legalDocumentVersion.findMany({
    where: { id: { in: pendingVersions.map(({ id }) => id) } },
  });
  return NextResponse.json({
    pending: pendingDocuments.map((version) => ({
      id: version.id,
      documentType: version.documentType,
      version: version.version,
      ...getLocalizedLegalContent(version, locale),
    })),
    legalVersionIds: currentVersions.map(({ id }) => id),
    acceptedVersionIds: currentVersions
      .filter(({ id }) => !pendingVersions.some((pending) => pending.id === id))
      .map(({ id }) => id),
    accepted: pendingVersions.length === 0,
  });
});

export const POST = withAuth(async (request, { user, clientIp, userAgent }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = acceptanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Select all required legal documents" }, { status: 400 });
  }

  const { currentVersions } = await getPendingLegalDocuments(user.id);
  const requestedIds = [...new Set(parsed.data.legalVersionIds)].sort((a, b) => a - b);
  const currentIds = currentVersions.map(({ id }) => id).sort((a, b) => a - b);
  if (
    currentVersions.length === 0 ||
    requestedIds.length !== currentIds.length ||
    requestedIds.some((id, index) => id !== currentIds[index])
  ) {
    return NextResponse.json(
      { error: "The legal documents changed. Review the current versions and try again." },
      { status: 409 },
    );
  }

  await prisma.$transaction(
    currentVersions.map((version) =>
      prisma.legalAcceptance.upsert({
        where: {
          userId_legalVersionId: {
            userId: user.id,
            legalVersionId: version.id,
          },
        },
        create: {
          userId: user.id,
          legalVersionId: version.id,
          ip: clientIp?.slice(0, 45) ?? null,
          userAgent,
        },
        update: {},
      }),
    ),
  );

  return NextResponse.json({ accepted: true });
});
