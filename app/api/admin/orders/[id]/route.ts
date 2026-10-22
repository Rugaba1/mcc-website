import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const idOf = async (ctx: Ctx) => {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const n = (v: unknown) => Number(v ?? 0);

export async function GET(req: NextRequest, ctx: Ctx) {
  const { error } = await requireStaff(req);
  if (error) return error;
  const id = await idOf(ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
      coupon: { select: { code: true } },
      deliveryZone: { select: { name: true } },
      items: { orderBy: { id: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  });
  if (!o)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    fulfillment: o.fulfillment,
    currency: o.currency,
    placedAt: o.placedAt,
    paidAt: o.paidAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    cancelledAt: o.cancelledAt,
    customerName: o.user
      ? [o.user.firstName, o.user.lastName].filter(Boolean).join(" ")
      : (o.shipFullName ?? "Guest"),
    email: o.user?.email ?? o.guestEmail,
    phone: o.user?.phoneNumber ?? o.guestPhone ?? o.shipPhone,
    subtotal: n(o.subtotal),
    discountTotal: n(o.discountTotal),
    shippingFee: n(o.shippingFee),
    taxTotal: n(o.taxTotal),
    grandTotal: n(o.grandTotal),
    couponCode: o.coupon?.code ?? null,
    deliveryZone: o.deliveryZone?.name ?? null,
    customerNote: o.customerNote,
    internalNote: o.internalNote,
    shipFullName: o.shipFullName,
    shipPhone: o.shipPhone,
    shipProvince: o.shipProvince,
    shipDistrict: o.shipDistrict,
    shipSector: o.shipSector,
    shipStreet: o.shipStreet,
    shipNotes: o.shipNotes,
    itemCount: o.items.length,
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      sku: i.sku,
      size: i.size,
      finish: i.finish,
      image: i.image,
      saleType: i.saleType,
      quantity: n(i.quantity), // m²
      containers: i.containers,
      unitPrice: n(i.unitPrice), // per m²
      lineTotal: n(i.lineTotal),
    })),
    payments: o.payments.map((p) => ({
      id: p.id,
      status: p.status,
      method: p.method,
      amount: n(p.amount),
      currency: p.currency,
      provider: p.provider,
      reference: p.providerRef,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
    history: o.history.map((h) => ({
      id: h.id,
      status: h.status,
      note: h.note,
      createdAt: h.createdAt,
    })),
    invoices: o.invoices.map((inv) => ({
      id: inv.id,
      kind: inv.kind,
      number: inv.number,
      issuedAt: inv.issuedAt,
      url: `/api/invoices/${inv.number}`,
    })),
  });
}

const statusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  note: z.string().trim().max(255).optional(),
});
class OrderError extends Error {}

type StockState = "RESERVED" | "SOLD" | "NONE";
const stockState = (s: string): StockState =>
  s === "SHIPPED" || s === "DELIVERED"
    ? "SOLD"
    : s === "CANCELLED" || s === "REFUNDED"
      ? "NONE"
      : "RESERVED"; // PENDING, PAID, PROCESSING

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { claims, error } = await requireStaff(req);
  if (error) return error;
  const id = await idOf(ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { status, note } = statusSchema.parse(await req.json());
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        select: {
          status: true,
          orderNumber: true,
          items: { select: { variantId: true, quantity: true } },
        },
      });
      if (!current)
        throw Object.assign(new Error("not found"), { code: "NOT_FOUND" });
      if (current.status === status) return;

      const from = stockState(current.status);
      const to = stockState(status);
      if (from === "NONE")
        throw new OrderError("Cancelled or refunded orders can't be reopened");
      if (from === "SOLD" && to === "RESERVED")
        throw new OrderError(
          "A shipped order can't go back to an earlier status",
        );

      // m² per variant for this order
      const sqmByVariant = new Map<number, number>();
      for (const i of current.items) {
        if (i.variantId == null) continue; // variant was deleted
        sqmByVariant.set(
          i.variantId,
          Math.round(
            ((sqmByVariant.get(i.variantId) ?? 0) + Number(i.quantity)) * 100,
          ) / 100,
        );
      }

      if (from !== to) {
        for (const [variantId, sqm] of sqmByVariant) {
          let type: "SALE" | "RELEASE" | "RETURN";
          if (from === "RESERVED" && to === "SOLD") {
            await tx.inventory.updateMany({
              where: { variantId },
              data: {
                reservedSqm: { decrement: sqm },
                onHandSqm: { decrement: sqm },
              },
            });
            type = "SALE";
          } else if (from === "RESERVED" && to === "NONE") {
            await tx.inventory.updateMany({
              where: { variantId },
              data: { reservedSqm: { decrement: sqm } },
            });
            type = "RELEASE";
          } else {
            // SOLD -> NONE: goods come back into stock
            await tx.inventory.updateMany({
              where: { variantId },
              data: { onHandSqm: { increment: sqm } },
            });
            type = "RETURN";
          }
          await tx.stockMovement.create({
            data: {
              variantId,
              type,
              quantity: sqm,
              reference: current.orderNumber,
              note: `Order ${current.status} → ${status}`,
              createdById: claims.userId,
            },
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: {
          status,
          ...(status === "SHIPPED" && { shippedAt: now }),
          ...(status === "DELIVERED" && { deliveredAt: now }),
          ...(status === "CANCELLED" && { cancelledAt: now }),
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          note: note || null,
          changedById: claims.userId,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    if (e instanceof OrderError)
      return NextResponse.json({ error: e.message }, { status: 409 });
    if ((e as { code?: string })?.code === "NOT_FOUND")
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    console.error("PATCH /api/admin/orders/[id]:", e);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}