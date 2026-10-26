export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const PROGRESS: Partial<Record<OrderStatus, number>> = {
  PENDING: 0,
  PAID: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
) {
  if (current === next) return true;
  if (current === "CANCELLED" || current === "REFUNDED") return false;
  if (next === "REFUNDED") return true;
  if (next === "CANCELLED")
    return current === "PENDING" || current === "PAID" || current === "PROCESSING";

  return (PROGRESS[next] ?? -1) > (PROGRESS[current] ?? Number.POSITIVE_INFINITY);
}
