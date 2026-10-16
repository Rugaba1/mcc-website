import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { computeTotals } from "@/lib/pricing";
import { getShipping, SHIPPING_IDS } from "@/lib/shipping";

export const runtime = "nodejs";

class CheckoutError extends Error {}

const schema = z
  .object({
    items: z
      .array(
        z.object({
          variantId: z.number().int().positive(),
          qty: z.number().int().min(1).max(10_000),
        }),
      )
      .min(1)
      .max(50),
    shippingId: z.enum(SHIPPING_IDS),
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20),
    district: z.string().trim().max(80).optional(),
    sector: z.string().trim().max(80).optional(),
    street: z.string().trim().max(200).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .superRefine((d, ctx) => {
    if (
      getShipping(d.shippingId).fulfillment === "DELIVERY" &&
      (!d.district || !d.street)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["street"],
        message: "District and street are required for delivery",
      });
    }
  });

export async function POST(request: NextRequest) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  try {
    const d = schema.parse(await request.json());
    const ship = getShipping(d.shippingId);

    // Merge duplicate lines for the same variant
    const qtyByVariant = new Map<number, number>();
    for (const i of d.items) {
      qtyByVariant.set(i.variantId, (qtyByVariant.get(i.variantId) ?? 0) + i.qty);
    }
    const ids = [...qtyByVariant.keys()];

    const order = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: claims.userId },
        select: { isActive: true },
      });
      if (!user?.isActive) throw new CheckoutError("Account is not active");

      const variants = await tx.productVariant.findMany({
        where: { id: { in: ids }, active: true, product: { status: "ACTIVE" } },
        include: { product: { select: { name: true } } },
      });
      if (variants.length !== ids.length) {
        throw new CheckoutError("Some items in your cart are no longer available");
      }

      // Prices come from the database, never from the browser
      const lines = variants.map((v) => {
        const qty = qtyByVariant.get(v.id)!;
        const unit = Number(v.pricePerBox);
        return { v, qty, unit, total: unit * qty };
      });

      // Atomic reservation: affects 0 rows if available stock is short
      // (or if the variant has no inventory row yet).
      for (const l of lines) {
        const n = await tx.$executeRaw`
          UPDATE inventory
          SET reservedBoxes = reservedBoxes + ${l.qty}
          WHERE variantId = ${l.v.id}
            AND (allowBackorder = 1 OR onHandBoxes - reservedBoxes >= ${l.qty})`;
        if (n === 0) {
          throw new CheckoutError(
            `Not enough stock for ${l.v.product.name} (${l.v.size})`,
          );
        }
      }

      const totals = computeTotals(
        lines.map((l) => ({ price: l.unit, qty: l.qty })),
        ship.fee,
      );
      const delivery = ship.fulfillment === "DELIVERY";
      const orderNumber = `MCC-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${randomInt(100000, 1000000)}`;

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: claims.userId,
          fulfillment: ship.fulfillment,
          subtotal: totals.subtotal,
          shippingFee: totals.shippingFee,
          taxTotal: totals.tax,
          grandTotal: totals.total,
          shipFullName: d.fullName,
          shipPhone: d.phone,
          shipDistrict: delivery ? d.district ?? null : null,
          shipSector: delivery ? d.sector || null : null,
          shipStreet: delivery ? d.street ?? null : null,
          customerNote: d.note || null,
          items: {
            create: lines.map((l) => ({
              variantId: l.v.id,
              productName: l.v.product.name,
              sku: l.v.sku,
              size: l.v.size,
              finish: l.v.finish,
              shadeCode: l.v.shadeCode,
              image: l.v.image,
              quantity: l.qty,
              sqmPerBox: l.v.sqmPerBox,
              unitPrice: l.unit,
              lineTotal: l.total,
            })),
          },
          history: {
            create: {
              status: "PENDING",
              note: "Order placed",
              changedById: claims.userId,
            },
          },
        },
        select: { id: true, orderNumber: true },
      });

      await tx.stockMovement.createMany({
        data: lines.map((l) => ({
          variantId: l.v.id,
          type: "RESERVE" as const,
          quantity: l.qty,
          reference: created.orderNumber,
          createdById: claims.userId,
        })),
      });

      return created;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    if (e instanceof CheckoutError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    console.error("Checkout error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}