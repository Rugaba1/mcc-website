import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth/require-user";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // userId in the filter: other people's orders look like "not found"
  const o = await prisma.order.findFirst({
    where: { id, userId: claims.userId },
    include: {
      items: true,
      history: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!o)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    currency: o.currency,
    placedAt: o.placedAt.toISOString(),
    itemCount: o.items.length,
    fulfillment: o.fulfillment,
    subtotal: Number(o.subtotal),
    discountTotal: Number(o.discountTotal),
    shippingFee: Number(o.shippingFee),
    taxTotal: Number(o.taxTotal),
    grandTotal: Number(o.grandTotal),
    customerNote: o.customerNote,
    shipFullName: o.shipFullName,
    shipPhone: o.shipPhone,
    shipDistrict: o.shipDistrict,
    shipSector: o.shipSector,
    shipStreet: o.shipStreet,
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      sku: i.sku,
      size: i.size,
      finish: i.finish,
      image: i.image,
      quantity: i.quantity,
      sqmPerBox: Number(i.sqmPerBox),
      unitPrice: Number(i.unitPrice),
      lineTotal: Number(i.lineTotal),
    })),
    history: o.history.map((h) => ({
      id: h.id,
      status: h.status,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
    payments: o.payments.map((p) => ({
      id: p.id,
      status: p.status,
      method: p.method,
      amount: Number(p.amount),
      paidAt: p.paidAt?.toISOString() ?? null,
    })),
  });
}
