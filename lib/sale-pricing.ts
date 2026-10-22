export type SaleType = "SQM" | "CONTAINER";

export interface PricedVariant {
  pricePerSqm: number;  
  containerPricePerSqm?: number | null;  
  sqmPerContainer?: number | null; 
}

export interface PricedLine {
  saleType: SaleType;
  sqm: number;  
  containers: number;  
  pricePerSqm: number; 
  total: number;  
  saved: number;  
}

export const MIN_SQM = 1;  

const round = (n: number, d = 2) => Number(n.toFixed(d));

export const canSellByContainer = (v: PricedVariant) =>
  !!v.containerPricePerSqm &&
  v.containerPricePerSqm > 0 &&
  !!v.sqmPerContainer &&
  v.sqmPerContainer > 0;

/** qty = m² wanted (SQM) or number of containers (CONTAINER). */
export function priceLine(
  v: PricedVariant,
  saleType: SaleType,
  qty: number,
): PricedLine {
  if (!Number.isFinite(qty) || qty <= 0)
    throw new Error("Quantity must be above 0");

  if (saleType === "CONTAINER") {
    if (!canSellByContainer(v))
      throw new Error("This tile is not sold by container");
    const containers = Math.floor(qty);
    if (containers < 1) throw new Error("Order at least 1 container");
    const sqm = round(containers * v.sqmPerContainer!);
    return {
      saleType,
      sqm,
      containers,
      pricePerSqm: v.containerPricePerSqm!,
      total: Math.round(sqm * v.containerPricePerSqm!),
      saved: Math.round(sqm * (v.pricePerSqm - v.containerPricePerSqm!)),
    };
  }

  const sqm = round(qty);
  if (sqm < MIN_SQM) throw new Error(`The minimum order is ${MIN_SQM} m²`);
  return {
    saleType,
    sqm,
    containers: 0,
    pricePerSqm: v.pricePerSqm,
    total: Math.round(sqm * v.pricePerSqm),
    saved: 0,
  };
}
