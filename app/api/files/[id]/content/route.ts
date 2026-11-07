import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { readUploadedFile } from "@/lib/uploads/storage";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withPermission(PERM.MEDIA_VIEW)(
  async (_request, context) => {
    const id = Number((await (context as RouteContext).params).id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    try {
      const file = await prisma.mediaFile.findUnique({
        where: { id },
        select: { url: true, mimeType: true },
      });
      if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

      const segments = new URL(file.url, "http://localhost").pathname
        .split("/")
        .filter(Boolean)
        .slice(1);
      const content = await readUploadedFile(segments);
      if (!content) return NextResponse.json({ error: "File not found" }, { status: 404 });

      return new NextResponse(new Uint8Array(content.content), {
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Type": file.mimeType || content.contentType,
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid upload path") {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      console.error("GET /api/files/[id]/content failed:", error);
      return NextResponse.json({ error: "Could not read the file" }, { status: 500 });
    }
  },
);
