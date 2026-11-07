import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

export const runtime = "nodejs";

const folderName = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine(
    (name) =>
      name.split("/").length <= 4 &&
      name.split("/").every((part) => /^[\p{L}\p{N} _.-]+$/u.test(part) && part !== "." && part !== ".."),
    "Use up to four folder levels with letters, numbers, spaces, hyphens, or underscores.",
  );

export const GET = withPermission(PERM.MEDIA_VIEW)(async () => {
  const folders = await prisma.mediaFolder.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { files: true } } },
  });
  return NextResponse.json({
    folders: folders.map(({ _count, ...folder }) => ({
      ...folder,
      fileCount: _count.files,
    })),
  });
});

export const POST = withPermission(PERM.MEDIA_MANAGE)(
  async (request: NextRequest) => {
    const parsed = z.object({ name: folderName }).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid folder name" },
        { status: 400 },
      );
    }

    try {
      const folder = await prisma.mediaFolder.create({
        data: { name: parsed.data.name },
      });
      return NextResponse.json({ ...folder, fileCount: 0 }, { status: 201 });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2002") {
        return NextResponse.json({ error: "A folder with that name already exists" }, { status: 409 });
      }
      console.error("POST /api/media-folders failed:", error);
      return NextResponse.json({ error: "Could not create folder" }, { status: 500 });
    }
  },
);
