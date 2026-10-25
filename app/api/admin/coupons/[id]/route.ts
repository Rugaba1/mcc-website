import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { normalizeCouponCode } from "@/lib/coupons";

const schema = z
  .object({
    code: z.string().trim().min(2).max(50).transform(normalizeCouponCode).optional(),
    description: z.string().trim().max(255).nullable().optional(),
    type: z.enum(["PERCENT", "FIXED"]).optional(),
    value: z.number().positive().max(1_000_000_000).optional(),
    minOrderAmount: z.number().nonnegative().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one coupon field to update",
  })
  .refine(
    (data) => data.type !== "PERCENT" || data.value === undefined || data.value <= 100,
    { message: "Percentage discounts cannot exceed 100%", path: ["value"] },
  )
  .refine(
    (data) =>
      !data.startsAt ||
      !data.expiresAt ||
      new Date(data.startsAt) < new Date(data.expiresAt),
    { message: "End date must be after the start date", path: ["expiresAt"] },
  );

export const PATCH = withPermission(PERM.COUPONS_MANAGE)(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid coupon" },
        { status: 400 },
      );
    }
    const data = parsed.data;

    try {
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      }
      const type = data.type ?? existing.type;
      const value = data.value ?? Number(existing.value);
      if (type === "PERCENT" && value > 100) {
        return NextResponse.json(
          { error: "Percentage discounts cannot exceed 100%" },
          { status: 400 },
        );
      }
      const startsAt =
        data.startsAt === undefined
          ? existing.startsAt
          : data.startsAt
            ? new Date(data.startsAt)
            : null;
      const expiresAt =
        data.expiresAt === undefined
          ? existing.expiresAt
          : data.expiresAt
            ? new Date(data.expiresAt)
            : null;
      if (startsAt && expiresAt && startsAt >= expiresAt) {
        return NextResponse.json(
          { error: "End date must be after the start date" },
          { status: 400 },
        );
      }

      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          ...data,
          startsAt,
          expiresAt,
        },
      });
      return NextResponse.json({
        coupon: {
          ...coupon,
          value: Number(coupon.value),
          minOrderAmount:
            coupon.minOrderAmount === null
              ? null
              : Number(coupon.minOrderAmount),
        },
      });
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
      console.error("PATCH /api/admin/coupons failed:", error);
      return NextResponse.json({ error: "Could not update coupon" }, { status: 500 });
    }
  },
);
