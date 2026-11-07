export const EDITABLE_PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
] as const;

export type EditablePaymentStatus = (typeof EDITABLE_PAYMENT_STATUSES)[number];

export function canTransitionPaymentStatus(current: string, next: string) {
  if (current === next) return true;

  if (current === "PENDING")
    return next === "AUTHORIZED" || next === "PAID" || next === "FAILED";
  if (current === "AUTHORIZED") return next === "PAID" || next === "FAILED";

  return false;
}
