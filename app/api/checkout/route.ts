import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { computeTotals } from "@/lib/pricing"; // your existing totals helper, unchanged
import { getShipping, SHIPPING_IDS } from "@/lib/shipping";
import { PaymentMethod, PaymentStatus } from "@/lib/generated/prisma";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { isValidLocation } from "@/lib/locations";
import { PAYMENT_METHODS } from "@/lib/payments";
import { issueInvoiceSafely } from "@/lib/invoices/invoice";
import { priceLine, SaleType } from "@/lib/sale-pricing";
import {
  sendAdminNotificationEmail,
  sendOrderPlacedEmail,
} from "@/lib/email";

export const runtime = "nodejs";

class CheckoutError extends Error {}

const r2 = (n: number) => Math.round(n * 100) / 100;

const schema = z
  .object({
    items: z
      .array(
        z
          .object({
            variantId: z.number().int().positive(),
            saleType: z.enum(["SQM", "CONTAINER"]).default("SQM"),
            qty: z.number().positive().max(100_000), // m² for SQM, containers for CONTAINER
          })
          .refine((i) => i.saleType === "SQM" || Number.isInteger(i.qty), {
            message: "Containers must be a whole number",
            path: ["qty"],
          }),
      )
      .min(1)
      .max(50),
    shippingId: z.enum(SHIPPING_IDS),
    fullName: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .refine((v) => isValidPhoneNumber(v), "Enter a valid phone number"),
    province: z.string().trim().max(80).optional(),
    district: z.string().trim().max(80).optional(),
    sector: z.string().trim().max(80).optional(),
    street: z.string().trim().max(200).optional(),
    note: z.string().trim().max(1000).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS),
  })
  .superRefine((d, ctx) => {
    if (getShipping(d.shippingId).fulfillment !== "DELIVERY") return;
    if (!d.province || !d.district || !d.street) {
      ctx.addIssue({
        code: "custom",
        path: ["street"],
        message: "Province, district and street are required for delivery",
      });
    } else if (
      !isValidLocation(d.province, d.district, d.sector || undefined)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["district"],
        message: "Invalid province, district or sector",
      });
    }
  });

export async function POST(request: NextRequest) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  try {
    const d = schema.parse(await request.json());
    const ship = getShipping(d.shippingId);

    // Merge duplicate lines: same variant AND same sale type
    const wanted = new Map<
      string,
      { variantId: number; saleType: SaleType; qty: number }
    >();
    for (const i of d.items) {
      const key = `${i.variantId}:${i.saleType}`;
      const cur = wanted.get(key);
      wanted.set(key, {
        variantId: i.variantId,
        saleType: i.saleType,
        qty: r2((cur?.qty ?? 0) + i.qty),
      });
    }
    const ids = [...new Set([...wanted.values()].map((w) => w.variantId))];

    const order = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: claims.userId },
        select: { isActive: true, email: true, firstName: true, lastName: true },
      });
      if (!user?.isActive) throw new CheckoutError("Account is not active");

      const variants = await tx.productVariant.findMany({
        where: { id: { in: ids }, active: true, product: { status: "ACTIVE" } },
        include: { product: { select: { name: true } } },
      });
      if (variants.length !== ids.length) {
        throw new CheckoutError(
          "Some items in your cart are no longer available",
        );
      }
      const byId = new Map(variants.map((v) => [v.id, v]));

      // Prices come from the database, never from the browser
      const lines = [...wanted.values()].map((w) => {
        const v = byId.get(w.variantId)!;
        const label = `${v.product.name} (${v.size})`;
        const pricePerSqm = Number(v.pricePerSqm);
        if (!(pricePerSqm > 0))
          throw new CheckoutError(`${label} has no price yet`);
        try {
          const line = priceLine(
            {
              pricePerSqm,
              containerPricePerSqm:
                v.containerPricePerSqm != null
                  ? Number(v.containerPricePerSqm)
                  : null,
              sqmPerContainer:
                v.sqmPerContainer != null ? Number(v.sqmPerContainer) : null,
            },
            w.saleType,
            w.qty,
          );
          return { v, line };
        } catch (e) {
          throw new CheckoutError(`${label}: ${(e as Error).message}`);
        }
      });

      const sqmByVariant = new Map<number, number>();
      for (const { v, line } of lines) {
        sqmByVariant.set(v.id, r2((sqmByVariant.get(v.id) ?? 0) + line.sqm));
      }

      for (const [variantId, sqm] of sqmByVariant) {
        const n = await tx.$executeRaw`
          UPDATE inventory
          SET reservedBoxes = reservedBoxes + ${sqm}
          WHERE variantId = ${variantId}
            AND (allowBackorder = 1 OR onHandBoxes - reservedBoxes >= ${sqm})`;
        if (n === 0) {
          const v = byId.get(variantId)!;
          throw new CheckoutError(
            `Not enough stock for ${v.product.name} (${v.size})`,
          );
        }
      }

      // Each line total is already rounded, so feed them in as price × 1
      const totals = computeTotals(
        lines.map((l) => ({ price: l.line.total, qty: 1 })),
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
          shipProvince: delivery ? (d.province ?? null) : null,
          shipDistrict: delivery ? (d.district ?? null) : null,
          shipSector: delivery ? d.sector || null : null,
          shipStreet: delivery ? (d.street ?? null) : null,
          customerNote: d.note || null,
          items: {
            create: lines.map(({ v, line }) => ({
              variantId: v.id,
              productName: v.product.name,
              sku: v.sku,
              size: v.size,
              finish: v.finish,
              shadeCode: v.shadeCode,
              image: v.image,
              saleType: line.saleType,
              quantity: line.sqm, // always m²
              containers: line.containers || null,
              unitPrice: line.pricePerSqm, // per m²
              lineTotal: line.total,
            })),
          },
          history: {
            create: {
              status: "PENDING",
              note: "Order placed",
              changedById: claims.userId,
            },
          },
          payments: {
            create: {
              amount: totals.total,
              payerPhone: d.phone,
              status: PaymentStatus.PENDING,
              currency: "RWF",
              method: d.paymentMethod as PaymentMethod,
              // "manual" = the customer can add the transaction ID or withdraw it from My payments
              provider: d.paymentMethod === "CARD" ? null : "manual",
            },
          },
        },
        select: { id: true, orderNumber: true },
      });

      await tx.stockMovement.createMany({
        data: [...sqmByVariant].map(([variantId, sqm]) => ({
          variantId,
          type: "RESERVE" as const,
          quantity: sqm,
          reference: created.orderNumber,
          createdById: claims.userId,
        })),
      });

      return {
        ...created,
        customerEmail: user.email,
        customerName: [user.firstName, user.lastName].filter(Boolean).join(" "),
        customerFirstName: user.firstName,
        total: totals.total,
      };
    });

    // After the commit, so the invoice code can see the order. Never throws.
    await issueInvoiceSafely(order.id);
    const total = `${order.total.toLocaleString("en-US")} RWF`;
    await Promise.all([
      sendOrderPlacedEmail({
        to: order.customerEmail,
        firstName: order.customerFirstName,
        orderNumber: order.orderNumber,
        total,
      }),
      sendAdminNotificationEmail({
        name: order.customerName || "Customer",
        email: order.customerEmail,
        subject: `New order ${order.orderNumber}`,
        message: `Order ${order.orderNumber} has been placed.\nTotal: ${total}`,
      }),
    ]);

    return NextResponse.json(
      { id: order.id, orderNumber: order.orderNumber },
      { status: 201 },
    );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
