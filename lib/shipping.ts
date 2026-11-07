export const SHIPPING_IDS = ["pickup", "delivery"] as const;
export type ShippingId = (typeof SHIPPING_IDS)[number];

export const DELIVERY_FEE_PER_SQM = 500;

export const SHIPPING_OPTIONS: {
  id: ShippingId;
  label: string;
  fulfillment: "PICKUP" | "DELIVERY";
}[] = [
  {
    id: "pickup",
    label: "Pick up at the factory, Muhanga",
    fulfillment: "PICKUP",
  },
  {
    id: "delivery",
    label: "Delivery",
    fulfillment: "DELIVERY",
  },
];

export const getShipping = (id: ShippingId) =>
  SHIPPING_OPTIONS.find((o) => o.id === id) ?? SHIPPING_OPTIONS[0];

export function calculateDeliveryFee(totalSqm: number) {
  if (!Number.isFinite(totalSqm) || totalSqm < 0) {
    throw new RangeError("Total delivery area must be a non-negative number");
  }
  return Math.round(totalSqm * DELIVERY_FEE_PER_SQM * 100) / 100;
}
