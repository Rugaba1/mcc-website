import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  const orders = await prisma.order.findMany({
    where: { userId: claims.userId },
    orderBy: { placedAt: "desc" },
    take: 200,
    select: {
      id: true, orderNumber: true, status: true, paymentStatus: true,
      grandTotal: true, currency: true, placedAt: true,
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id, orderNumber: o.orderNumber, status: o.status, paymentStatus: o.paymentStatus,
      grandTotal: Number(o.grandTotal), currency: o.currency,
      placedAt: o.placedAt.toISOString(), itemCount: o._count.items,
    })),
  );
}