"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { useCart } from "@/contexts/cart-context";
import { computeTotals } from "@/lib/pricing";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function CartPage() {
    const { items, ready, setQty, removeFromCart, clearCart } = useCart();

    if (!ready) return <div className="mx-auto max-w-6xl px-6 py-24 text-center text-sm text-muted-foreground">Loading your cart…</div>;

    if (items.length === 0) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
                <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
                <h1 className="font-playfair text-3xl font-bold">Your cart is empty</h1>
                <p className="mt-2 text-sm text-muted-foreground">Browse our tiles and add what you like.</p>
                <Button asChild className="mt-6"><Link href="/#products">Browse tiles</Link></Button>
            </div>
        );
    }

    const totals = computeTotals(items.map((i) => ({ price: i.pricePerBox, qty: i.qty })), 0);
    const totalSqm = items.reduce((s, i) => s + i.qty * i.sqmPerBox, 0);

    return (
        <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="mb-8 flex items-end justify-between">
                <h1 className="font-playfair text-4xl font-bold">Your cart</h1>
                <button onClick={clearCart} className="text-sm text-muted-foreground hover:text-destructive hover:underline">Clear cart</button>
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
                <ul className="divide-y divide-border rounded-2xl border border-border bg-background">
                    {items.map((i) => (
                        <li key={i.variantId} className="flex gap-4 p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={i.image} alt="" className="h-24 w-24 shrink-0 rounded-lg bg-muted object-cover" />
                            <div className="flex min-w-0 flex-1 flex-col justify-between">
                                <div>
                                    <p className="truncate font-semibold">{i.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {[i.size, i.finish, i.color].filter(Boolean).join(" · ")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {i.sqmPerBox} m² per box · covers {(i.sqmPerBox * i.qty).toFixed(2)} m²
                                    </p>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex items-center rounded-md border border-border">
                                        <Button variant="ghost" size="icon" aria-label="Fewer boxes" disabled={i.qty <= 1} onClick={() => setQty(i.variantId, i.qty - 1)}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <input
                                            aria-label="Boxes" type="number" min={1} value={i.qty}
                                            onChange={(e) => setQty(i.variantId, Number(e.target.value))}
                                            className="h-9 w-14 bg-transparent text-center text-sm focus:outline-none"
                                        />
                                        <Button variant="ghost" size="icon" aria-label="More boxes" onClick={() => setQty(i.variantId, i.qty + 1)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="font-semibold">{money(i.pricePerBox * i.qty)}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" aria-label={`Remove ${i.name}`} onClick={() => removeFromCart(i.variantId)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </li>
                    ))}
                </ul>

                <aside className="sticky top-20 space-y-4 rounded-2xl border border-border bg-background p-6">
                    <h2 className="font-playfair text-xl font-bold">Order summary</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Boxes</dt><dd>{items.reduce((s, i) => s + i.qty, 0)}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Total coverage</dt><dd>{totalSqm.toFixed(2)} m²</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">VAT (18%)</dt><dd>{money(totals.tax)}</dd></div>
                        <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Estimated total</dt><dd>{money(totals.total)}</dd></div>
                    </dl>
                    <p className="text-xs text-muted-foreground">Delivery is added at checkout. Prices are confirmed when you place the order.</p>
                    <Button asChild className="w-full"><Link href="/checkout">Checkout</Link></Button>
                    <Button asChild variant="outline" className="w-full"><Link href="/#products">Continue shopping</Link></Button>
                </aside>
            </div>
        </div>
    );
}