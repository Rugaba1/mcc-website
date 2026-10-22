"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MIN_SQM, canSellByContainer, priceLine, type PricedLine, type PricedVariant, type SaleType } from "@/lib/pricing";

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const rwf = (n: number) => `${nf.format(n)} RWF`;

 
export function PurchaseOptions({
  variant,
  onAdd,
  disabled,
}: {
  variant: PricedVariant;
  onAdd: (item: { saleType: SaleType; qty: number }, line: PricedLine) => void;
  disabled?: boolean;
}) {
  const byContainer = canSellByContainer(variant);
  const [type, setType] = useState<SaleType>("SQM");
  const [sqm, setSqm] = useState("10");
  const [containers, setContainers] = useState(1);

  const qty = type === "SQM" ? Number(sqm) : containers;
  const { line, error } = useMemo(() => {
    if (!(qty > 0)) return { line: null, error: null };
    try {
      return { line: priceLine(variant, type, qty), error: null };
    } catch (e) {
      return { line: null, error: (e as Error).message };
    }
  }, [variant, type, qty]);

  const perSqmSaving = byContainer ? variant.pricePerSqm - variant.containerPricePerSqm! : 0;
  const bigOrder = byContainer && type === "SQM" && Number(sqm) >= variant.sqmPerContainer!;

  const option = (t: SaleType, label: string, price?: number | null, off = false) => (
    <button
      type="button"
      disabled={off}
      onClick={() => setType(t)}
      className={`flex-1 border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${type === t ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="block text-xs text-muted-foreground">{off ? "Not available for this tile" : `${rwf(price ?? 0)} per m²`}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {option("SQM", "By m²", variant.pricePerSqm)}
        {option("CONTAINER", "By container", variant.containerPricePerSqm, !byContainer)}
      </div>

      {type === "SQM" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">How many m² do you need?</label>
          <Input className="rounded-none" type="number" min={MIN_SQM} step={0.1} value={sqm} onChange={(e) => setSqm(e.target.value)} />
          {byContainer && perSqmSaving > 0 && (
            <p className="border-l-2 border-primary bg-muted/50 p-2 text-xs">
              {bigOrder ? "That’s a container’s worth. " : ""}
              Buy a full container ({nf.format(variant.sqmPerContainer!)} m²) and pay {rwf(variant.containerPricePerSqm!)} per m², saving {rwf(perSqmSaving)} on every m².
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">How many containers?</label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="rounded-none" onClick={() => setContainers((c) => Math.max(1, c - 1))} aria-label="Fewer"><Minus /></Button>
            <Input className="w-20 rounded-none text-center" type="number" min={1} value={containers} onChange={(e) => setContainers(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
            <Button type="button" variant="outline" size="icon" className="rounded-none" onClick={() => setContainers((c) => c + 1)} aria-label="More"><Plus /></Button>
          </div>
          <p className="text-sm text-muted-foreground">1 container = {nf.format(variant.sqmPerContainer!)} m².</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {line && (
        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>{nf.format(line.sqm)} m² × {rwf(line.pricePerSqm)}</span></div>
          {line.saved > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>You save</span><span className="tabular-nums">{rwf(line.saved)}</span></div>}
          <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="tabular-nums">{rwf(line.total)}</span></div>
        </div>
      )}

      <Button className="w-full rounded-none" disabled={disabled || !line} onClick={() => line && onAdd({ saleType: type, qty }, line)}>
        <ShoppingCart /> Add to cart
      </Button>
    </div>
  );
}