import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

export const runtime = "nodejs";

const r2 = (n: number) => Math.round(n * 100) / 100;
const sqm = z.number().min(0).max(10_000_000).transform(r2); // m², 2 decimals

const bodySchema = z.object({
  stockSqm: sqm,
  
  lowStockThreshold: sqm,
});

export const PUT = withPermission(PERM.INVENTORY_ADJUST)(
  async (request: NextRequest, context) => {

  const variantId = Number((await context.params!).variantId);
  if (!Number.isSafeInteger(variantId) || variantId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const data = bodySchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: { select: { id: true, name: true } },
          inventory: true,
        },
      });
      if (!variant) return null;

      const before = Number(variant.inventory?.onHandSqm ?? 0);
      const inv = await tx.inventory.upsert({
        where: { variantId },
        create: {
          variantId,
          onHandSqm: data.stockSqm,
          reservedSqm: 0,
          reorderLevel: data.lowStockThreshold,
        },
        update: {
          onHandSqm: data.stockSqm,
          reorderLevel: data.lowStockThreshold,
        },
      });

      if (before !== data.stockSqm) {
        await tx.stockMovement.create({
          data: {
            variantId,
            type: "ADJUSTMENT",
            quantity: r2(data.stockSqm - before),
            note: `Manual: ${before} → ${data.stockSqm} m²`,
            createdById: context.user.id,
          },
        });
      }
      return { variant, inv };
    });
    if (!result)
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });

    const { variant, inv } = result;
    return NextResponse.json({
      id: variant.id,
      productId: variant.product.id,
      productName: variant.product.name,
      sku: variant.sku,
      size: variant.size,
      finish: variant.finish,
      color: variant.color,
      stockSqm: Number(inv.onHandSqm),
      reservedSqm: Number(inv.reservedSqm),
      lowStockThreshold: Number(inv.reorderLevel),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: e.issues },
        { status: 400 },
      );
    }
    console.error("Stock update error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
