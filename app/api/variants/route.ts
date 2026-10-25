import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { blankToNull, serializeVariant, variantSchema } from "@/lib/variant";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const createSchema = variantSchema.extend({
  stockSqm: z.number().min(0).max(10_000_000).default(0),
  lowStockThreshold: z.number().min(0).max(10_000_000).default(0),
});

const productIdOf = async (ctx: Ctx) => {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Admin list: includes inactive variants and current stock
export const GET = withPermission(PERM.VARIANTS_MANAGE)(
  async (_req: NextRequest, context) => {
  const productId = await productIdOf(context as Ctx);
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
      stockSqm: Number(inventory?.onHandSqm ?? 0),
      lowStockThreshold: inventory?.reorderLevel ?? 0,
    })),
  );
  },
);

export const POST = withPermission(PERM.VARIANTS_MANAGE)(
  async (req: NextRequest, context) => {
  const productId = await productIdOf(context as Ctx);
  if (!productId)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { stockSqm, lowStockThreshold, ...rest } = createSchema.parse(
      await req.json(),
    );
    const baseCurrency = await prisma.currency.findFirst({
      where: { isBase: true, enabled: true },
      select: { code: true },
    });
    if (!baseCurrency) {
      return NextResponse.json(
        { error: "Store base currency is not configured" },
        { status: 503 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: { ...blankToNull(rest), productId, currency: baseCurrency.code },
      });
      await tx.inventory.create({
        data: {
          variantId: variant.id,
          onHandSqm: stockSqm,
          reservedSqm: 0,
          reorderLevel: lowStockThreshold,
        },
      });
      if (stockSqm > 0) {
        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            type: "PURCHASE",
            quantity: stockSqm,
            note: "Initial stock",
            createdById: context.user.id,
          },
        });
      }
      return variant;
    });

    return NextResponse.json(
      { ...serializeVariant(created), stockSqm, lowStockThreshold },
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
});
