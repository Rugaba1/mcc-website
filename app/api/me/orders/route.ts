import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth/require-user";
import { invoicePath } from "../../../../lib/invoices/url"; // not "lib/invoices": keeps pdfmake out of this route

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  const orders = await prisma.order.findMany({
    where: { userId: claims.userId },
    orderBy: { placedAt: "desc" },
    take: 200,
    // Prisma allows `select` OR `include`, never both, so invoices go inside select.
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      grandTotal: true,
      currency: true,
      placedAt: true,
      _count: { select: { items: true } },
      invoices: {
        select: { id: true, kind: true, number: true, issuedAt: true },
        orderBy: { issuedAt: "asc" },
      },
    },
  });

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      grandTotal: Number(o.grandTotal),
      currency: o.currency,
      placedAt: o.placedAt.toISOString(),
      itemCount: o._count.items,
      invoices: o.invoices.map((inv) => ({
        id: inv.id,
        kind: inv.kind,
        number: inv.number,
        issuedAt: inv.issuedAt.toISOString(),
        url: invoicePath(inv.number),
      })),
    })),
  );
}
