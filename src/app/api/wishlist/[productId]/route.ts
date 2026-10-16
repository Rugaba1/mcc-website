import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  const productId = Number((await params).productId);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await prisma.wishlistItem.deleteMany({
    where: { userId: claims.userId, productId },
  });
  return NextResponse.json({ ok: true });
}
