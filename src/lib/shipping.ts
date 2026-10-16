export const SHIPPING_IDS = ["pickup", "muhanga", "kigali", "rusizi"] as const;
export type ShippingId = (typeof SHIPPING_IDS)[number];

// Fees are placeholders from your old cart. Edit them here only.
export const SHIPPING_OPTIONS: {
  id: ShippingId;
  label: string;
  fee: number;
  fulfillment: "PICKUP" | "DELIVERY";
}[] = [
  {
    id: "pickup",
    label: "Pick up at the factory, Muhanga",
    fee: 0,
    fulfillment: "PICKUP",
  },
  {
    id: "muhanga",
    label: "Delivery in Muhanga",
    fee: 0,
    fulfillment: "DELIVERY",
  },
  {
    id: "kigali",
    label: "Delivery in Kigali",
    fee: 0,
    fulfillment: "DELIVERY",
  },
  {
    id: "rusizi",
    label: "Delivery to Rusizi",
    fee: 5000,
    fulfillment: "DELIVERY",
  },
];

export const getShipping = (id: ShippingId) =>
  SHIPPING_OPTIONS.find((o) => o.id === id) ?? SHIPPING_OPTIONS[0];
