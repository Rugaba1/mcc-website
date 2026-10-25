import type { Coupon } from "@/lib/generated/prisma";

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function calculateCouponDiscount(
  coupon: Pick<
    Coupon,
    | "type"
    | "value"
    | "minOrderAmount"
    | "maxUses"
    | "usedCount"
    | "startsAt"
    | "expiresAt"
    | "active"
  >,
  subtotal: number,
  now = new Date(),
): { discount: number; error: string | null } {
  if (!coupon.active) return { discount: 0, error: "This coupon is not active" };
  if (coupon.startsAt && coupon.startsAt > now) {
    return { discount: 0, error: "This coupon is not available yet" };
  }
  if (coupon.expiresAt && coupon.expiresAt <= now) {
    return { discount: 0, error: "This coupon has expired" };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { discount: 0, error: "This coupon has reached its usage limit" };
  }
  if (
    coupon.minOrderAmount !== null &&
    subtotal < Number(coupon.minOrderAmount)
  ) {
    return { discount: 0, error: "Your order does not meet this coupon's minimum" };
  }

  const value = Number(coupon.value);
  const discount =
    coupon.type === "PERCENT"
      ? (subtotal * Math.min(value, 100)) / 100
      : Math.min(subtotal, value);

  return { discount: Math.round(discount * 100) / 100, error: null };
}
