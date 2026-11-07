import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const DELETE = withPermission(PERM.MEDIA_MANAGE)(
  async (_request, context) => {
    const id = Number((await (context as RouteContext).params).id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    try {
      const folder = await prisma.mediaFolder.findUnique({
        where: { id },
        include: { _count: { select: { files: true } } },
      });
      if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      if (folder._count.files > 0) {
        return NextResponse.json(
          { error: "Move or remove the files in this folder before deleting it" },
          { status: 409 },
        );
      }
      await prisma.mediaFolder.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("DELETE /api/media-folders/[id] failed:", error);
      return NextResponse.json({ error: "Could not delete folder" }, { status: 500 });
    }
  },
);
