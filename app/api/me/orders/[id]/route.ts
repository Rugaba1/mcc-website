import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";
import { invoicePath } from "@/lib/invoices/url";
export const runtime = "nodejs";

export const GET = withAuth(
  async (
    _request: NextRequest,
    { user, params }: { user: { id: number }; params: Promise<{ id: string }> },
  ) => {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // userId in the filter: other people's orders look like "not found"
  const o = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      coupon: { select: { code: true } },
      items: true,
      history: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      invoices: {
        select: { id: true, kind: true, number: true, issuedAt: true },
        orderBy: { issuedAt: "asc" },
      },
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
    couponCode: o.coupon?.code ?? null,
    shippingFee: Number(o.shippingFee),
    taxTotal: Number(o.taxTotal),
    grandTotal: Number(o.grandTotal),
    customerNote: o.customerNote,
    shipFullName: o.shipFullName,
    shipPhone: o.shipPhone,
    tin: o.tin,
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
    invoices: o.invoices.map((inv) => ({
      id: inv.id,
      kind: inv.kind,
      number: inv.number,
      issuedAt: inv.issuedAt.toISOString(),
      url: invoicePath(inv.number),
    })),
  });
  },
);
