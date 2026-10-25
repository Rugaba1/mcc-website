import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  releaseCheckoutReservation,
  releaseExpiredCheckoutReservations,
} from "@/lib/checkout/reservations";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { prisma } from "@/lib/prisma";
import { priceLine, type SaleType } from "@/lib/sale-pricing";

export const runtime = "nodejs";
const HOLD_MINUTES = 15;

const schema = z.object({
  items: z.array(z.object({
    variantId: z.number().int().positive(),
    saleType: z.enum(["SQM", "CONTAINER"]).default("SQM"),
    qty: z.number().positive().max(100_000),
  })).min(1).max(50),
  reservationToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/).optional(),
}).superRefine((data, ctx) => {
  data.items.forEach((item, index) => {
    if (item.saleType === "CONTAINER" && !Number.isInteger(item.qty)) {
      ctx.addIssue({
        code: "custom",
        path: ["items", index, "qty"],
        message: "Containers must be a whole number",
      });
    }
  });
});

class ReservationError extends Error {}

const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const POST = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 20,
})(async (request: NextRequest) => {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid reservation request" },
        { status: 400 },
      );
    }

    const token = parsed.data.reservationToken ?? randomBytes(32).toString("base64url");
    const hash = tokenHash(token);
    const expiry = new Date(Date.now() + HOLD_MINUTES * 60_000);
    const wanted = new Map<string, { variantId: number; saleType: SaleType; qty: number }>();
    for (const item of parsed.data.items) {
      const key = `${item.variantId}:${item.saleType}`;
      const current = wanted.get(key);
      wanted.set(key, {
        variantId: item.variantId,
        saleType: item.saleType,
        qty: Math.round(((current?.qty ?? 0) + item.qty) * 100) / 100,
      });
    }

    await prisma.$transaction(async (tx) => {
      await releaseExpiredCheckoutReservations(tx);
    });

    await prisma.$transaction(async (tx) => {
      const existing = await tx.checkoutReservation.findUnique({
        where: { tokenHash: hash },
        include: { items: true },
      });
      if (existing?.status === "CONSUMED") {
        throw new ReservationError("This checkout reservation has already been used");
      }
      if (existing?.status === "ACTIVE") {
        await releaseCheckoutReservation(tx, existing);
      }

      const ids = [...new Set([...wanted.values()].map((item) => item.variantId))];
      const variants = await tx.productVariant.findMany({
        where: { id: { in: ids }, active: true, product: { status: "ACTIVE" } },
        include: { product: { select: { name: true } } },
      });
      if (variants.length !== ids.length) {
        throw new ReservationError("Some items are no longer available");
      }
      const byId = new Map(variants.map((variant) => [variant.id, variant]));
      const quantities = new Map<number, number>();
      for (const wantedItem of wanted.values()) {
        const variant = byId.get(wantedItem.variantId)!;
        try {
          const line = priceLine({
            pricePerSqm: Number(variant.pricePerSqm),
            containerPricePerSqm:
              variant.containerPricePerSqm == null
                ? null
                : Number(variant.containerPricePerSqm),
            sqmPerContainer:
              variant.sqmPerContainer == null
                ? null
                : Number(variant.sqmPerContainer),
          }, wantedItem.saleType, wantedItem.qty);
          quantities.set(
            wantedItem.variantId,
            Math.round(((quantities.get(wantedItem.variantId) ?? 0) + line.sqm) * 100) / 100,
          );
        } catch (error) {
          throw new ReservationError(
            `${variant.product.name} (${variant.size}): ${(error as Error).message}`,
          );
        }
      }

      for (const [variantId, sqm] of quantities) {
        const reserved = await tx.$executeRaw`
          UPDATE inventory
          SET reservedBoxes = reservedBoxes + ${sqm}
          WHERE variantId = ${variantId}
            AND (allowBackorder = 1 OR onHandBoxes - reservedBoxes >= ${sqm})`;
        if (reserved !== 1) {
          const variant = byId.get(variantId)!;
          throw new ReservationError(`Not enough stock for ${variant.product.name} (${variant.size})`);
        }
      }

      const reservation = existing
        ? await tx.checkoutReservation.update({
            where: { id: existing.id },
            data: {
              status: "ACTIVE",
              expiresAt: expiry,
              items: {
                deleteMany: {},
                create: [...quantities].map(([variantId, quantitySqm]) => ({
                  variantId,
                  quantitySqm,
                })),
              },
            },
          })
        : await tx.checkoutReservation.create({
            data: {
              tokenHash: hash,
              status: "ACTIVE",
              expiresAt: expiry,
              items: {
                create: [...quantities].map(([variantId, quantitySqm]) => ({
                  variantId,
                  quantitySqm,
                })),
              },
            },
          });

      await tx.stockMovement.createMany({
        data: [...quantities].map(([variantId, quantity]) => ({
          variantId,
          type: "RESERVE" as const,
          quantity,
          reference: `checkout:${reservation.tokenHash}`,
          note: "Temporary checkout hold",
        })),
      });
    });

    return NextResponse.json({
      reservationToken: token,
      expiresAt: expiry.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid reservation request" },
        { status: 400 },
      );
    }
    if (error instanceof ReservationError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("POST /api/checkout/reservation failed:", error);
    return NextResponse.json({ error: "Could not reserve the requested stock" }, { status: 500 });
  }
});
