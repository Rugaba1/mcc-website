"use client";

import { MediaImage } from "@/components/media-image";

import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { clampQty, lineOf, useCart, type CartItem } from "@/contexts/cart-context";
import { computeTotals } from "@/lib/pricing";
import { MIN_SQM } from "@/lib/sale-pricing";
import { useFormatters } from "@/contexts/format-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Number box that only commits on blur or Enter, so typing "12.5" isn't fought by clamping. */
function QtyInput({ item, onCommit }: { item: CartItem; onCommit: (n: number) => void }) {
    const [draft, setDraft] = useState(String(item.qty));
    useEffect(() => setDraft(String(item.qty)), [item.qty]);

    const commit = () => {
        const n = Number(draft);
        if (!Number.isFinite(n) || n <= 0) return setDraft(String(item.qty));
        const q = clampQty(item.saleType, n);
        onCommit(q);
        setDraft(String(q));
    };

    return (
        <Input
            aria-label={item.saleType === "CONTAINER" ? "Containers" : "Square metres"}
            type="number" inputMode="decimal"
            min={item.saleType === "SQM" ? MIN_SQM : 1} step={item.saleType === "SQM" ? 0.1 : 1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="h-9 w-20 bg-transparent text-center text-sm focus:outline-none"
        />
    );
}

export default function CartPage() {
    const { displayMoney, number, baseCurrency } = useFormatters();
    const { items, ready, setQty, removeFromCart, clearCart } = useCart();

    if (!ready) return <div className="mx-auto max-w-6xl px-6 py-24 text-center text-sm text-muted-foreground">Loading your cart…</div>;

    if (items.length === 0) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
                <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
                <h1 className="font-playfair text-3xl font-bold">Your cart is empty</h1>
                <p className="mt-2 text-sm text-muted-foreground">Browse our tiles and add what you like.</p>
                <Button asChild className="mt-6"><Link href="/products">Browse tiles</Link></Button>
            </div>
        );
    }

    const lines = items.map((i) => ({ item: i, line: lineOf(i) }));
    const priced = lines.filter((l) => l.line);
    const totals = computeTotals(priced.map((l) => ({ price: l.line!.total, qty: 1 })), 0);
    const totalSqm = priced.reduce((s, l) => s + l.line!.sqm, 0);

    return (
        <div className="mx-auto max-w-6xl px-2">
            <div className="mb-8 flex items-end justify-between">
                <h1 className="font-playfair text-4xl font-bold">Your cart</h1>
                <Button onClick={clearCart} variant={"destructive"}>Clear cart</Button>
            </div>

            <div className="grid contain-content gap-2 grid-cols-1 lg:grid-cols-[1fr_0.5fr]">
                <ul className="divide-y divide-border border border-border bg-background">
                    {lines.map(({ item: i, line }) => {
                        const step = 1;
                        const min = i.saleType === "SQM" ? MIN_SQM : 1;
                        return (
                            <li key={`${i.variantId}-${i.saleType}`} className="flex gap-2 p-2 flex-wrap">
                                <MediaImage src={i.image} alt="" className="h-24 w-24 shrink-0 bg-muted object-cover" />
                                <div className="flex min-w-0 flex-1 flex-col justify-between">
                                    <div>
                                        <p className="truncate font-semibold">{i.name}</p>
                                        <p className="text-xs text-muted-foreground">{[i.size, i.finish].filter(Boolean).join(" · ")}</p>
                                        {line ? (
                                            <p className="text-xs text-muted-foreground">
                                                {i.saleType === "CONTAINER"
                                                    ? `${line.containers} container${line.containers === 1 ? "" : "s"} · ${number(line.sqm, { maximumFractionDigits: 2 })} m² × ${displayMoney(line.pricePerSqm, i.currency ?? baseCurrency)}`
                                                    : `${number(line.sqm, { maximumFractionDigits: 2 })} m² × ${displayMoney(line.pricePerSqm, i.currency ?? baseCurrency)}`}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-destructive">This item can’t be priced. Please remove it.</p>
                                        )}
                                        {line && line.saved > 0 && <p className="text-xs font-medium text-success dark:text-success">Container price, you save {displayMoney(line.saved, i.currency ?? baseCurrency)}</p>}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center border border-border">
                                            <Button variant="ghost" size="icon" aria-label="Less" disabled={i.qty <= min} onClick={() => setQty(i.variantId, i.saleType, i.qty - step)}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <QtyInput item={i} onCommit={(n) => setQty(i.variantId, i.saleType, n)} />
                                            <Button variant="ghost" size="icon" aria-label="More" onClick={() => setQty(i.variantId, i.saleType, i.qty + step)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                            <span className="px-2 text-xs text-muted-foreground">{i.saleType === "CONTAINER" ? "containers" : "m²"}</span>
                                        </div>
                                        <p className="font-semibold">{line ? displayMoney(line.total, i.currency ?? baseCurrency) : "—"}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" aria-label={`Remove ${i.name}`} onClick={() => removeFromCart(i.variantId, i.saleType)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </li>
                        );
                    })}
                </ul>

                <aside className="sticky top-20 space-y-4 border border-border bg-background p-6">
                    <h2 className="font-playfair text-xl font-bold">Order summary</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Items</dt><dd>{items.length}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Total area</dt><dd>{number(totalSqm, { maximumFractionDigits: 2 })} m²</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{displayMoney(totals.subtotal, baseCurrency)}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">VAT (18%)</dt><dd>{displayMoney(totals.tax, baseCurrency)}</dd></div>
                        <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Estimated total</dt><dd>{displayMoney(totals.total, baseCurrency)}</dd></div>
                    </dl>
                    <p className="text-xs text-muted-foreground">
                        Delivery is added at checkout. Converted prices are estimates; payment is processed in {baseCurrency}.
                    </p>
                    <Button asChild className="w-full" disabled={priced.length !== items.length}><Link href="/checkout">Checkout</Link></Button>
                    <Button asChild variant="outline" className="w-full"><Link href="/products">Continue shopping</Link></Button>
                </aside>
            </div>
        </div>
    );
}