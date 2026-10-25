import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

type Context = { params: Promise<{ id: string }> };

export const POST = withPermission(PERM.CONTENT_MANAGE)(
  async (_request: NextRequest, context) => {
    const id = Number((await context.params!).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid legal document version" }, { status: 400 });
    }
    const version = await prisma.legalDocumentVersion.findUnique({ where: { id } });
    if (!version) {
      return NextResponse.json({ error: "Legal version not found" }, { status: 404 });
    }
    if (version.publishedAt) {
      return NextResponse.json({ error: "This version is already published" }, { status: 409 });
    }
    if (
      !version.title.trim() ||
      !version.titleFr.trim() ||
      !version.titleRw.trim() ||
      !version.contentMarkdown.trim() ||
      !version.contentMarkdownFr.trim() ||
      !version.contentMarkdownRw.trim()
    ) {
      return NextResponse.json(
        { error: "Complete the title and Markdown content for English, French, and Kinyarwanda before publishing." },
        { status: 400 },
      );
    }

    const result = await prisma.legalDocumentVersion.updateMany({
      where: { id, publishedAt: null },
      data: { publishedAt: new Date() },
    });
    if (!result.count) {
      return NextResponse.json({ error: "This version was published concurrently" }, { status: 409 });
    }
    return NextResponse.json({ published: true });
  },
);
