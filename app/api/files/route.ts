import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireStaff(req);
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(sp.get("limit") ?? "24", 10) || 24, 1), 100);
  const page = Math.max(parseInt(sp.get("page") ?? "1", 10) || 1, 1);
  const q = sp.get("q")?.trim();
  const kind = sp.get("kind");

  const where: Prisma.MediaFileWhereInput = {};
  if (kind === "image" || kind === "file") where.kind = kind;
  if (q) where.OR = [{ name: { contains: q } }, { originalName: { contains: q } }];

  const [total, files] = await Promise.all([
    prisma.mediaFile.count({ where }),
    prisma.mediaFile.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: (page - 1) * limit }),
  ]);

  return NextResponse.json({ files, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
}