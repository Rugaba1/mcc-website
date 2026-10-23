"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/app/i18n/routing";
import { ProtectedRoute } from "@/components/protected-route";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentSummary } from "@/components/checkout/payment-summary";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { api, apiErrorMessage } from "@/lib/api";
import { money } from "@/lib/format";
import { getShipping, SHIPPING_OPTIONS, ShippingId } from "@/lib/shipping";
import { computeTotals } from "@/lib/pricing";
import { PAYMENT_OPTIONS, type PaymentMethodId } from "@/lib/payments";
import type { Opt } from "@/lib/locations"; // type-only, so the JSON isn't bundled
import { COMPANY } from "@/lib/company";
function useOptions(url: string | null) {
    const [opts, setOpts] = useState<Opt[]>([]);
    useEffect(() => {
        if (!url) { setOpts([]); return; }
        const ctrl = new AbortController();
        fetch(url, { signal: ctrl.signal })
            .then((r) => (r.ok ? r.json() : []))
            .then(setOpts)
            .catch(() => { });
        return () => ctrl.abort();
    }, [url]);
    return opts;
}

function LocationSelect({ id, label, value, onChange, options, placeholder, disabled, required }: {
    id: string; label: string; value: string; onChange: (v: string) => void;
    options: Opt[]; placeholder: string; disabled?: boolean; required?: boolean;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Select name={id} value={value} onValueChange={onChange} disabled={disabled} required={required}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function CheckoutForm() {
    const { user } = useAuth();
    const { items, ready, clearCart } = useCart();
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("MTN_MOMO");
    const [shippingId, setShippingId] = useState<ShippingId>("pickup");
    const [f, setF] = useState({
        fullName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
        phone: "", province: "", district: "", sector: "", street: "", note: "",
    });

    const provinces = useOptions("/api/locations/provinces");
    const districts = useOptions(
        f.province ? `/api/locations/districts?province=${encodeURIComponent(f.province)}` : null,
    );
    const sectors = useOptions(
        f.province && f.district
            ? `/api/locations/sectors?province=${encodeURIComponent(f.province)}&district=${encodeURIComponent(f.district)}`
            : null,
    );
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set = (k: keyof typeof f) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setF((p) => ({ ...p, [k]: e.target.value }));

    const ship = getShipping(shippingId);
    const delivery = ship.fulfillment === "DELIVERY";
    const totals = computeTotals(items.map((i) => ({ price: i.pricePerSqm, qty: i.qty })), ship.fee);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        if (!f.phone || !isValidPhoneNumber(f.phone)) {
            setError("Please enter a valid phone number.");
            return;
        }
        if (delivery && (!f.province || !f.district)) {
            setError("Please select your province and district.");
            return;
        }
        setBusy(true);
        try {
            const order = await api.checkout({
                items: items.map((i) => ({ variantId: i.variantId, saleType: i.saleType, qty: i.qty })),
                shippingId,
                paymentMethod,
                fullName: f.fullName, phone: f.phone,
                province: delivery ? f.province : undefined,
                district: delivery ? f.district : undefined,
                sector: delivery ? f.sector || undefined : undefined,
                street: delivery ? f.street : undefined,
                note: f.note || undefined,
            });
            clearCart();
            toast.success(`Order ${order.orderNumber} placed`);
            router.replace(`/account/orders/${order.id}`);
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

                <fieldset className="space-y-2 border border-border p-5">
                    <legend className="px-2 font-semibold">Delivery</legend>
                    {SHIPPING_OPTIONS.map((o) => (
                        <label
                            key={o.id}
                            className={`flex w-full cursor-pointer items-center justify-between gap-3 border p-3 text-sm ${shippingId === o.id ? "border-primary bg-primary/5" : "border-border"}`}
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="shipping"
                                    checked={shippingId === o.id}
                                    onChange={() => setShippingId(o.id)}
                                    className="accent-primary"
                                />
                                <span>{o.label}</span>
                            </div>
                            <span className="font-medium">{o.fee ? money(o.fee) : "Free"}</span>
                        </label>
                    ))}
                </fieldset>

                <fieldset className="space-y-4 border border-border p-5">
                    <legend className="px-2 font-semibold">{delivery ? "Delivery address" : "Contact"}</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full name</Label>
                            <Input id="fullName" required value={f.fullName} onChange={set("fullName")} autoComplete="name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <PhoneInput
                                id="phone"
                                international
                                defaultCountry="RW"
                                countryCallingCodeEditable={false}
                                value={f.phone}
                                onChange={(v) => setF((p) => ({ ...p, phone: v ?? "" }))}
                                autoComplete="tel"
                                required
                            />
                        </div>
                    </div>

                    {delivery && (
                        <>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <LocationSelect
                                    id="province" label="Province" required
                                    value={f.province} options={provinces} placeholder="Select province"
                                    onChange={(v) => setF((p) => ({ ...p, province: v, district: "", sector: "" }))}
                                />
                                <LocationSelect
                                    id="district" label="District" required
                                    value={f.district} options={districts}
                                    placeholder={f.province ? "Select district" : "Select province first"}
                                    disabled={!f.province}
                                    onChange={(v) => setF((p) => ({ ...p, district: v, sector: "" }))}
                                />
                                <LocationSelect
                                    id="sector" label="Sector (optional)"
                                    value={f.sector} options={sectors}
                                    placeholder={f.district ? "Select sector" : "Select district first"}
                                    disabled={!f.district}
                                    onChange={(v) => setF((p) => ({ ...p, sector: v }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="street">Street / landmark</Label>
                                <Input id="street" required value={f.street} onChange={set("street")} />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="note">Note (optional)</Label>
                        <Textarea id="note" rows={3} maxLength={1000} value={f.note} onChange={set("note")} />
                    </div>
                </fieldset>

                <fieldset className="space-y-2 border border-border p-5">
                    <legend className="px-2 font-semibold">Payment method</legend>
                    {PAYMENT_OPTIONS.map((o) => (
                        <label
                            key={o.id}
                            className={`flex w-full cursor-pointer items-center gap-3 border p-3 text-sm ${paymentMethod === o.id ? "border-primary bg-primary/5" : "border-border"}`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                checked={paymentMethod === o.id}
                                onChange={() => setPaymentMethod(o.id)}
                                className="accent-primary"
                            />
                            <div>
                                <div className="font-medium">{o.label}</div>
                                <div className="text-xs text-muted-foreground">{o.hint}</div>
                            </div>
                        </label>
                    ))}
                    <PaymentSummary method={paymentMethod} phone={f.phone} total={totals.total} />
                </fieldset>
            </div>

            <aside className="sticky top-20 space-y-4 border border-border bg-background p-6">
                <h2 className="font-playfair text-xl font-bold">Your order</h2>
                <ul className="space-y-2 text-sm">
                    {items.map((i) => (
                        <li key={i.variantId} className="flex justify-between gap-3">
                            <span className="truncate">{i.qty} × {i.name} <span className="text-muted-foreground">({i.size})</span></span>
                            <span>{money(i.pricePerSqm * i.qty)}</span>
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
                <p className="text-xs text-muted-foreground">
                    Our team will contact you to confirm payment (MTN MoMo, Airtel Money, card or bank transfer).
                    Need help? Call {COMPANY.phone}.
                </p>
            </aside>
        </form>
    );
}

export default function CheckoutPage() {
    return <ProtectedRoute><CheckoutForm /></ProtectedRoute>;
}