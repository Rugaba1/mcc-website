import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";

export const runtime = "nodejs";

export const DELETE = withAuth(async (
  _request: NextRequest,
  { user, params }: { user: { id: number }; params: Promise<{ productId: string }> },
) => {
  const productId = Number((await params).productId);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId },
  });
  return NextResponse.json({ ok: true });
});
