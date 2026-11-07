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
import { CheckoutProgress } from "@/components/checkout-progress";
import { CartProductPickerDialog } from "@/components/cart-product-picker-dialog";

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

    if (!ready) return <div className="mx-auto max-w-6xl px-6 py-24 text-center text-sm text-muted-foreground">Loading your order…</div>;

    if (items.length === 0) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
                <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
                <h1 className="font-playfair text-3xl font-bold">Your order is empty</h1>
                <p className="mt-2 text-sm text-muted-foreground">Browse our tiles and choose what you need.</p>
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
            <div className="mb-8 pt-6">
                <CheckoutProgress currentStep={1} />
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
                <h1 className="font-playfair text-3xl font-bold sm:text-4xl">My order</h1>
                <Button onClick={clearCart} variant={"destructive"} className="min-h-11">Clear order</Button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.5fr)]">
                <ul className="min-w-0 divide-y divide-border border border-border bg-background">
                    {lines.map(({ item: i, line }) => {
                        const step = 1;
                        const min = i.saleType === "SQM" ? MIN_SQM : 1;
                        return (
                            <li
                                key={`${i.variantId}-${i.saleType}`}
                                className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_2.75rem] gap-3 p-3 sm:grid-cols-[6rem_minmax(0,1fr)_2.75rem] sm:p-4"
                            >
                                <MediaImage
                                    src={i.image}
                                    alt=""
                                    className="col-start-1 row-start-1 h-16 w-16 shrink-0 bg-muted object-cover sm:h-24 sm:w-24"
                                />
                                <div className="col-start-2 row-start-1 min-w-0">
                                    <div>
                                        <p className="break-words font-semibold leading-snug">{i.name}</p>
                                        <p className="mt-1 break-words text-xs text-muted-foreground">{[i.size, i.finish].filter(Boolean).join(" · ")}</p>
                                        {line ? (
                                            <p className="mt-1 break-words text-xs text-muted-foreground">
                                                {i.saleType === "CONTAINER"
                                                    ? `${line.containers} container${line.containers === 1 ? "" : "s"} · ${number(line.sqm, { maximumFractionDigits: 2 })} m² × ${displayMoney(line.pricePerSqm, i.currency ?? baseCurrency)}`
                                                    : `${number(line.sqm, { maximumFractionDigits: 2 })} m² × ${displayMoney(line.pricePerSqm, i.currency ?? baseCurrency)}`}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-destructive">This item can’t be priced. Please remove it.</p>
                                        )}
                                        {line && line.saved > 0 && <p className="mt-1 break-words text-xs font-medium text-success dark:text-success">Container price, you save {displayMoney(line.saved, i.currency ?? baseCurrency)}</p>}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Remove ${i.name}`}
                                    onClick={() => removeFromCart(i.variantId, i.saleType)}
                                    className="col-start-3 row-start-1 size-11 self-start"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                <div className="col-span-3 row-start-2 flex min-w-0 flex-wrap items-center justify-between gap-3 sm:col-start-2 sm:col-span-2">
                                        <div className="flex max-w-full items-center border border-border">
                                            <Button variant="ghost" size="icon" aria-label="Less" disabled={i.qty <= min} onClick={() => setQty(i.variantId, i.saleType, i.qty - step)}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <QtyInput item={i} onCommit={(n) => setQty(i.variantId, i.saleType, n)} />
                                            <Button variant="ghost" size="icon" aria-label="More" onClick={() => setQty(i.variantId, i.saleType, i.qty + step)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                            <span className="px-2 text-xs text-muted-foreground">{i.saleType === "CONTAINER" ? "containers" : "m²"}</span>
                                        </div>
                                        <p className="ml-auto break-words text-right font-semibold">{line ? displayMoney(line.total, i.currency ?? baseCurrency) : "—"}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <aside className="min-w-0 space-y-4 border border-border bg-background p-4 sm:p-6 lg:sticky lg:top-20">
                    <h2 className="font-playfair text-xl font-bold">Order summary</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Items</dt><dd>{items.length}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Total area</dt><dd>{number(totalSqm, { maximumFractionDigits: 2 })} m²</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{displayMoney(totals.subtotal, baseCurrency)}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">VAT (18%)</dt><dd>{displayMoney(totals.tax, baseCurrency)}</dd></div>
                        <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Estimated total</dt><dd>{displayMoney(totals.total, baseCurrency)}</dd></div>
                    </dl>
                    <p className="text-xs text-muted-foreground">
                        Delivery is added in the next step. Converted prices are estimates; payment is processed in {baseCurrency}.
                    </p>
                    <Button asChild className="w-full" disabled={priced.length !== items.length}><Link href="/checkout">Finish ordering</Link></Button>
                    <CartProductPickerDialog />
                </aside>
            </div>
        </div>
    );
}