import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readUploadedFile } from "@/lib/uploads/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

function notFound() {
  return new NextResponse(null, {
    status: 404,
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "CDN-Cache-Control": "no-store",
    },
  });
}

function serverError() {
  return new NextResponse(null, {
    status: 500,
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "CDN-Cache-Control": "no-store",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params;
  if (path.length !== 2) return notFound();

  try {
    const url = `/uploads/${path.join("/")}`;
    const record = await prisma.mediaFile.findUnique({
      where: { url },
      select: { isPublic: true },
    });
    if (record && !record.isPublic) return notFound();

    const file = await readUploadedFile(path);
    if (!file) return notFound();

    return new NextResponse(new Uint8Array(file.content), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": file.contentType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return notFound();
    }
    if (error instanceof Error && error.message === "Invalid upload path") {
      return notFound();
    }
    console.error("GET /uploads/[...path] failed:", error);
    return serverError();
  }
}
