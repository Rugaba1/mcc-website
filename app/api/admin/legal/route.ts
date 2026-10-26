import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { LegalDocumentType, Prisma } from "@/lib/generated/prisma/client";
import { legalDraftSchema } from "@/lib/legal/draft";

export const GET = withPermission(PERM.CONTENT_MANAGE)(async () => {
  const versions = await prisma.legalDocumentVersion.findMany({
    orderBy: [{ documentType: "asc" }, { version: "desc" }],
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
  return NextResponse.json({ versions });
});

export const POST = withPermission(PERM.CONTENT_MANAGE)(
  async (request: NextRequest, { user }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = legalDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid legal document draft",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.map(String),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    try {
      const latest = await prisma.legalDocumentVersion.findFirst({
        where: { documentType: parsed.data.documentType },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const version = await prisma.legalDocumentVersion.create({
        data: {
          ...parsed.data,
          version: (latest?.version ?? 0) + 1,
          createdById: user.id,
        },
      });
      return NextResponse.json({ version }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "A new version was created concurrently. Reload and try again." },
          { status: 409 },
        );
      }
      console.error("POST /api/admin/legal error:", error);
      return NextResponse.json({ error: "Could not create a legal draft" }, { status: 500 });
    }
  },
);
