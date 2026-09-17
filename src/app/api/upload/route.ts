import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Map MIME type → safe file extension (never trust the client filename)
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg":  ".jpg",
  "image/jpg":   ".jpg",
  "image/png":   ".png",
  "image/webp":  ".webp",
  "image/gif":   ".gif",
  "image/avif":  ".avif",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = MIME_TO_EXT[file.type];
    if (!ext)
      return NextResponse.json({ error: "File type not allowed. Use JPEG, PNG, WebP, GIF, or AVIF." }, { status: 400 });

    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

    const fileName    = `${randomUUID()}${ext}`;
    const uploadsDir  = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${fileName}` });
  } catch (err) {
    console.error("POST /api/upload:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
