import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

export const runtime = "nodejs";

// SVG is intentionally not allowed: an uploaded SVG can carry scripts.
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};
const FILE_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/csv": ".csv",
  "application/zip": ".zip",
};
const MAX = { image: 10 * 1024 * 1024, file: 25 * 1024 * 1024 };

// POST multipart: one or more "file" fields. Returns the first file's fields at the top
// level (compatible with the old response) plus `files` with everything saved.
export const POST = withPermission(PERM.MEDIA_UPLOAD)(async (
  req: NextRequest,
  { user },
) => {
  try {
    const form = await req.formData();
    const files = form
      .getAll("file")
      .filter((f): f is File => f instanceof File);
    if (!files.length)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (files.length > 20)
      return NextResponse.json(
        { error: "Upload at most 20 files at once" },
        { status: 400 },
      );

    const saved = [];
    const errors: string[] = [];

    for (const file of files) {
      const kind = IMAGE_TYPES[file.type]
        ? "image"
        : FILE_TYPES[file.type]
          ? "file"
          : null;
      if (!kind) {
        errors.push(`${file.name}: type not allowed`);
        continue;
      }
      if (file.size > MAX[kind]) {
        errors.push(`${file.name}: larger than ${MAX[kind] / 1024 / 1024} MB`);
        continue;
      }

      const ext = (kind === "image" ? IMAGE_TYPES : FILE_TYPES)[file.type];
      const folder = kind === "image" ? "images" : "files";
      const fileName = `${randomUUID()}${ext}`;
      const dir = join(process.cwd(), "public", "uploads", folder);
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, fileName),
        Buffer.from(await file.arrayBuffer()),
      );

      saved.push(
        await prisma.mediaFile.create({
          data: {
            name: file.name.replace(/\.[^.]+$/, "").slice(0, 200) || "file",
            originalName: file.name.slice(0, 255),
            url: `/uploads/${folder}/${fileName}`,
            kind,
            mimeType: file.type,
            size: file.size,
            uploadedById: user.id,
          },
        }),
      );
    }

    if (!saved.length)
      return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
    return NextResponse.json({ ...saved[0], files: saved, errors });
  } catch (err) {
    console.error("POST /api/upload:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
});
