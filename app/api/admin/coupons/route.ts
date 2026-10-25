import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { normalizeCouponCode } from "@/lib/coupons";

export const runtime = "nodejs";

const fields = {
  code: z.string().trim().min(2).max(50).transform(normalizeCouponCode),
  description: z.string().trim().max(255).nullable().optional(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive().max(1_000_000_000),
  minOrderAmount: z.number().nonnegative().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
};

const createSchema = z
  .object(fields)
  .strict()
  .refine((data) => data.type !== "PERCENT" || data.value <= 100, {
    message: "Percentage discounts cannot exceed 100%",
    path: ["value"],
  })
  .refine(
    (data) =>
      !data.startsAt ||
      !data.expiresAt ||
      new Date(data.startsAt) < new Date(data.expiresAt),
    { message: "End date must be after the start date", path: ["expiresAt"] },
  );

function serializeCoupon<T extends {
  value: unknown;
  minOrderAmount: unknown;
}>(coupon: T) {
  return {
    ...coupon,
    value: Number(coupon.value),
    minOrderAmount:
      coupon.minOrderAmount === null ? null : Number(coupon.minOrderAmount),
  };
}

export const GET = withPermission(PERM.COUPONS_VIEW)(async () => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      coupons: coupons.map(serializeCoupon),
    });
  } catch (error) {
    console.error("GET /api/admin/coupons failed:", error);
    return NextResponse.json({ error: "Could not load coupons" }, { status: 500 });
  }
});

export const POST = withPermission(PERM.COUPONS_MANAGE)(
  async (request: NextRequest) => {
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid coupon" },
        { status: 400 },
      );
    }

    try {
      const data = parsed.data;
      const coupon = await prisma.coupon.create({
        data: {
          ...data,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          active: data.active ?? true,
        },
      });
      return NextResponse.json({ coupon: serializeCoupon(coupon) }, { status: 201 });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "That coupon code already exists" },
          { status: 409 },
        );
      }
      console.error("POST /api/admin/coupons failed:", error);
      return NextResponse.json({ error: "Could not create coupon" }, { status: 500 });
    }
  },
);
