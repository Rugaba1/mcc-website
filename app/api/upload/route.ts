import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

const FILE_MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/csv": ".csv",
  "application/zip": ".zip",
};

const MAX_SIZE_BY_KIND = {
  image: 10 * 1024 * 1024,
  file: 25 * 1024 * 1024,
};

function getAllowedExt(kind: string, mimeType: string) {
  if (kind === "file") return FILE_MIME_TO_EXT[mimeType] || ".bin";
  return IMAGE_MIME_TO_EXT[mimeType] || ".jpg";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const kind = String(formData.get("kind") || "image").toLowerCase();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const normalizedKind = kind === "file" ? "file" : "image";
    const allowedExt = getAllowedExt(normalizedKind, file.type);

    if (normalizedKind === "image" && !IMAGE_MIME_TO_EXT[file.type]) {
      return NextResponse.json(
        {
          error:
            "File type not allowed. Use JPEG, PNG, WebP, GIF, AVIF, or SVG images.",
        },
        { status: 400 },
      );
    }

    if (normalizedKind === "file" && !FILE_MIME_TO_EXT[file.type]) {
      return NextResponse.json(
        {
          error:
            "File type not allowed. Use PDF, Excel, Word, CSV, or ZIP files.",
        },
        { status: 400 },
      );
    }

    const maxSize = MAX_SIZE_BY_KIND[normalizedKind] ?? MAX_SIZE_BY_KIND.image;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large (max ${Math.round(maxSize / 1024 / 1024)} MB)`,
        },
        { status: 400 },
      );
    }

    const fileName = `${randomUUID()}${allowedExt}`;
    const uploadFolder = normalizedKind === "file" ? "files" : "images";
    const uploadsDir = join(process.cwd(), "public", "uploads", uploadFolder);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(
      join(uploadsDir, fileName),
      Buffer.from(await file.arrayBuffer()),
    );

    return NextResponse.json({
      url: `/uploads/${uploadFolder}/${fileName}`,
      kind: normalizedKind,
      mimeType: file.type,
      size: file.size,
    });
  } catch (err) {
    console.error("POST /api/upload:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
