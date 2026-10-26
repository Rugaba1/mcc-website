import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { legalDraftUpdateSchema } from "@/lib/legal/draft";

type Context = { params: Promise<{ id: string }> };

export const PUT = withPermission(PERM.CONTENT_MANAGE)(
  async (request: NextRequest, context) => {
    const id = Number((await context.params!).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid legal document version" }, { status: 400 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = legalDraftUpdateSchema.safeParse(body);
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

    const result = await prisma.legalDocumentVersion.updateMany({
      where: { id, publishedAt: null },
      data: parsed.data,
    });
    if (!result.count) {
      const existing = await prisma.legalDocumentVersion.findUnique({
        where: { id },
        select: { id: true },
      });
      return NextResponse.json(
        { error: existing ? "Published versions are immutable" : "Legal version not found" },
        { status: existing ? 409 : 404 },
      );
    }
    const version = await prisma.legalDocumentVersion.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ version });
  },
);
