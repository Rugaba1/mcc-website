"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/app/i18n/routing";
import { ProtectedRoute } from "@/components/protected-route";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { api, apiErrorMessage } from "@/lib/api";
import { money } from "@/lib/format";
import { computeTotals } from "@/lib/pricing";
import { SHIPPING_OPTIONS, getShipping, type ShippingId } from "@/lib/shipping";

function CheckoutForm() {
    const { user } = useAuth();
    const { items, ready, clearCart } = useCart();
    const router = useRouter();

    const [shippingId, setShippingId] = useState<ShippingId>("pickup");
    const [f, setF] = useState({
        fullName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
        phone: "", district: "", sector: "", street: "", note: "",
    });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setF((p) => ({ ...p, [k]: e.target.value }));

    const ship = getShipping(shippingId);
    const delivery = ship.fulfillment === "DELIVERY";
    const totals = computeTotals(items.map((i) => ({ price: i.pricePerBox, qty: i.qty })), ship.fee);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const order = await api.checkout({
                items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
                shippingId,
                fullName: f.fullName, phone: f.phone,
                district: delivery ? f.district : undefined,
                sector: delivery ? f.sector || undefined : undefined,
                street: delivery ? f.street : undefined,
                note: f.note || undefined,
            });
            clearCart();
            toast.success(`Order ${order.orderNumber} placed`);
            router.replace(`/orders/${order.id}`);
        } catch (err) {
            setError(apiErrorMessage(err, "Could not place your order."));
            setBusy(false);
        }
    }

    if (!ready) return null;
    if (items.length === 0) {
        return (
            <div className="mx-auto max-w-md px-6 py-24 text-center">
                <p className="text-muted-foreground">Your cart is empty.</p>
                <Button asChild className="mt-4"><Link href="/#products">Browse tiles</Link></Button>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto grid max-w-6xl items-start gap-8 px-6 py-12 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
                <h1 className="font-playfair text-4xl font-bold">Checkout</h1>

                <fieldset className="space-y-2 rounded-2xl border border-border p-5">
                    <legend className="px-2 font-semibold">Delivery</legend>
                    {SHIPPING_OPTIONS.map((o) => (
                        <label key={o.id} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm ${shippingId === o.id ? "border-primary bg-primary/5" : "border-border"}`}>
                            <span className="flex items-center gap-3">
                                <input type="radio" name="shipping" checked={shippingId === o.id} onChange={() => setShippingId(o.id)} className="accent-primary" />
                                {o.label}
                            </span>
                            <span className="font-medium">{o.fee ? money(o.fee) : "Free"}</span>
                        </label>
                    ))}
                </fieldset>

                <fieldset className="space-y-4 rounded-2xl border border-border p-5">
                    <legend className="px-2 font-semibold">{delivery ? "Delivery address" : "Contact"}</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" required value={f.fullName} onChange={set("fullName")} autoComplete="name" /></div>
                        <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" required value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="+250 7XX XXX XXX" /></div>
                    </div>
                    {delivery && (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2"><Label htmlFor="district">District</Label><Input id="district" required value={f.district} onChange={set("district")} /></div>
                                <div className="space-y-2"><Label htmlFor="sector">Sector (optional)</Label><Input id="sector" value={f.sector} onChange={set("sector")} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="street">Street / landmark</Label><Input id="street" required value={f.street} onChange={set("street")} /></div>
                        </>
                    )}
                    <div className="space-y-2"><Label htmlFor="note">Note (optional)</Label><Textarea id="note" rows={3} maxLength={1000} value={f.note} onChange={set("note")} /></div>
                </fieldset>
            </div>

            <aside className="sticky top-20 space-y-4 rounded-2xl border border-border bg-background p-6">
                <h2 className="font-playfair text-xl font-bold">Your order</h2>
                <ul className="space-y-2 text-sm">
                    {items.map((i) => (
                        <li key={i.variantId} className="flex justify-between gap-3">
                            <span className="truncate">{i.qty} × {i.name} <span className="text-muted-foreground">({i.size})</span></span>
                            <span>{money(i.pricePerBox * i.qty)}</span>
                        </li>
                    ))}
                </ul>
                <dl className="space-y-2 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{totals.shippingFee ? money(totals.shippingFee) : "Free"}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">VAT (18%)</dt><dd>{money(totals.tax)}</dd></div>
                    <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Total</dt><dd>{money(totals.total)}</dd></div>
                </dl>
                <FormError message={error} />
                <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {busy ? "Placing order…" : "Place order"}
                </Button>
                <p className="text-xs text-muted-foreground">Our team will contact you to confirm payment (MTN MoMo, Airtel Money, card or bank transfer).</p>
            </aside>
        </form>
    );
}

export default function CheckoutPage() {
    return <ProtectedRoute><CheckoutForm /></ProtectedRoute>;
}