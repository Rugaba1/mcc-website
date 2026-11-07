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

type OrderStatusDateField = "paidAt" | "shippedAt" | "deliveredAt" | "cancelledAt";

export const ORDER_STATUS_DATE_FIELDS: Partial<
  Record<OrderStatus, OrderStatusDateField>
> = {
  PAID: "paidAt",
  SHIPPED: "shippedAt",
  DELIVERED: "deliveredAt",
  CANCELLED: "cancelledAt",
} as const;

export const ORDER_STATUS_DATE_LABELS = {
  PENDING: "order created",
  PAID: "payment received",
  PROCESSING: "order processing started",
  SHIPPED: "order shipped",
  DELIVERED: "order delivered",
  CANCELLED: "order cancelled",
  REFUNDED: "order refunded",
} as const;

export function orderStatusDateField(status: OrderStatus) {
  return ORDER_STATUS_DATE_FIELDS[status];
}

export function orderStatusDateLabel(status: OrderStatus) {
  return ORDER_STATUS_DATE_LABELS[status];
}

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
