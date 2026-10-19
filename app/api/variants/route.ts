import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";
import { blankToNull, serializeVariant, variantSchema } from "@/lib/variant";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const createSchema = variantSchema.extend({
  stockBoxes: z.number().int().min(0).max(1_000_000).default(0),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(0),
});

const productIdOf = async (ctx: Ctx) => {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Admin list: includes inactive variants and current stock
export async function GET(req: NextRequest, ctx: Ctx) {
  const { error } = await requireStaff(req);
  if (error) return error;
  const productId = await productIdOf(ctx);
  if (!productId)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const rows = await prisma.productVariant.findMany({
    where: { productId },
    orderBy: { id: "asc" },
    include: { inventory: true },
  });
  return NextResponse.json(
    rows.map(({ inventory, ...v }) => ({
      ...serializeVariant(v),
      stockBoxes: inventory?.onHandBoxes ?? 0,
      lowStockThreshold: inventory?.reorderLevel ?? 0,
    })),
  );
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { claims, error } = await requireStaff(req);
  if (error) return error;
  const productId = await productIdOf(ctx);
  if (!productId)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { stockBoxes, lowStockThreshold, ...rest } = createSchema.parse(
      await req.json(),
    );

    const created = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: { ...blankToNull(rest), productId },
      });
      await tx.inventory.create({
        data: {
          variantId: variant.id,
          onHandBoxes: stockBoxes,
          reorderLevel: lowStockThreshold,
        },
      });
      if (stockBoxes > 0) {
        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            type: "PURCHASE",
            quantity: stockBoxes,
            note: "Initial stock",
            createdById: claims.userId,
          },
        });
      }
      return variant;
    });

    return NextResponse.json(
      { ...serializeVariant(created), stockBoxes, lowStockThreshold },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid input", details: e.issues },
        { status: 400 },
      );
    const code = (e as { code?: string })?.code;
    if (code === "P2002")
      return NextResponse.json(
        { error: "That SKU is already in use" },
        { status: 409 },
      );
    if (code === "P2003")
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    console.error("POST /api/products/[id]/variants:", e);
    return NextResponse.json(
      { error: "Failed to create variant" },
      { status: 500 },
    );
  }
}
