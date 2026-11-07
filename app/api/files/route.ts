import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

export const runtime = "nodejs";

export const GET = withPermission(PERM.MEDIA_VIEW)(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(sp.get("limit") ?? "24", 10) || 24, 1), 100);
  const page = Math.max(parseInt(sp.get("page") ?? "1", 10) || 1, 1);
  const q = sp.get("q")?.trim();
  const kind = sp.get("kind");
  const folderParam = sp.get("folderId");

  const where: Prisma.MediaFileWhereInput = {};
  if (kind === "image" || kind === "file") where.kind = kind;
  if (folderParam === "root") {
    where.folderId = null;
  } else if (folderParam) {
    const folderId = Number(folderParam);
    if (!Number.isSafeInteger(folderId) || folderId < 1) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }
    where.folderId = folderId;
  }
  if (q) where.OR = [{ name: { contains: q } }, { originalName: { contains: q } }];

  const [total, files, folders] = await Promise.all([
    prisma.mediaFile.count({ where }),
    prisma.mediaFile.findMany({
      where,
      include: { folder: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.mediaFolder.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { files: true } } },
    }),
  ]);

  return NextResponse.json({
    files,
    folders: folders.map(({ _count, ...folder }) => ({
      ...folder,
      fileCount: _count.files,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});