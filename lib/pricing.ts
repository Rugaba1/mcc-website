import { VAT_RATE } from "./constants";

// Prices are treated as excluding VAT, as your old cart did.
// VAT applies to goods plus shipping.
export function computeTotals(
  items: { price: number; qty: number }[],
  shippingFee: number,
) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round((subtotal + shippingFee) * VAT_RATE);
  return { subtotal, shippingFee, tax, total: subtotal + shippingFee + tax };
}
