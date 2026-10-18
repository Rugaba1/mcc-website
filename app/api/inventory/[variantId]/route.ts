import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireStaff } from "../../../../lib/auth/require-staff";

export const runtime = "nodejs";

const bodySchema = z.object({
  stockBoxes: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(1_000_000),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }, // Next 14: params is not a Promise
) {
  const { claims, error } = await requireStaff(request);
  if (error) return error;

  const variantId = Number((await params).variantId);
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

      const before = variant.inventory?.onHandBoxes ?? 0;
      const inv = await tx.inventory.upsert({
        where: { variantId },
        create: {
          variantId,
          onHandBoxes: data.stockBoxes,
          reorderLevel: data.lowStockThreshold,
        },
        update: {
          onHandBoxes: data.stockBoxes,
          reorderLevel: data.lowStockThreshold,
        },
      });

      if (before !== data.stockBoxes) {
        await tx.stockMovement.create({
          data: {
            variantId,
            type: "ADJUSTMENT",
            quantity: data.stockBoxes - before,
            note: `Manual: ${before} → ${data.stockBoxes}`,
            createdById: claims.userId,
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
      stockBoxes: inv.onHandBoxes,
      lowStockThreshold: inv.reorderLevel,
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
}
