import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { calculateCouponDiscount, normalizeCouponCode } from "@/lib/coupons";
import { priceLine } from "@/lib/sale-pricing";

export const runtime = "nodejs";

const schema = z.object({
  code: z.string().trim().min(1).max(50),
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive(),
        saleType: z.enum(["SQM", "CONTAINER"]),
        qty: z.number().positive().max(100_000),
      }).refine((item) => item.saleType !== "CONTAINER" || Number.isInteger(item.qty), {
        message: "Containers must be a whole number",
        path: ["qty"],
      }),
    )
    .min(1)
    .max(50),
});

export const POST = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 10,
})(async (request: NextRequest) => {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid coupon request" },
      { status: 400 },
    );
  }

  try {
    const [coupon, baseCurrency] = await Promise.all([
      prisma.coupon.findUnique({
        where: { code: normalizeCouponCode(parsed.data.code) },
      }),
      prisma.currency.findFirst({
        where: { isBase: true, enabled: true },
        select: { code: true },
      }),
    ]);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon code is invalid" }, { status: 404 });
    }
    if (!baseCurrency) {
      return NextResponse.json(
        { error: "Store base currency is not configured" },
        { status: 409 },
      );
    }

    const variantIds = [
      ...new Set(parsed.data.items.map((item) => item.variantId)),
    ];
    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        active: true,
        product: { status: "ACTIVE" },
      },
      include: { product: { select: { name: true } } },
    });
    if (
      variants.length !== variantIds.length ||
      variants.some((variant) => variant.currency !== baseCurrency.code)
    ) {
      return NextResponse.json(
        { error: "Some items are no longer available at checkout" },
        { status: 409 },
      );
    }

    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    let subtotal: number;
    try {
      subtotal = parsed.data.items.reduce((sum, item) => {
        const variant = byId.get(item.variantId);
        if (!variant) return sum;
        const line = priceLine(
          {
            pricePerSqm: Number(variant.pricePerSqm),
            containerPricePerSqm:
              variant.containerPricePerSqm === null
                ? null
                : Number(variant.containerPricePerSqm),
            sqmPerContainer:
              variant.sqmPerContainer === null
                ? null
                : Number(variant.sqmPerContainer),
          },
          item.saleType,
          item.qty,
        );
        return sum + line.total;
      }, 0);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Some cart items cannot be priced",
        },
        { status: 400 },
      );
    }
    const result = calculateCouponDiscount(coupon, subtotal);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      subtotal,
      discount: result.discount,
      currency: baseCurrency.code,
    });
  } catch (error) {
    console.error("POST /api/coupons/validate failed:", error);
    return NextResponse.json(
      { error: "Could not validate coupon" },
      { status: 500 },
    );
  }
});
