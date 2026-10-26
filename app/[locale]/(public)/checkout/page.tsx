"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import { lineOf, useCart } from "@/contexts/cart-context";
import { api, apiErrorMessage, type CouponValidation } from "@/lib/api";
import { useFormatters } from "@/contexts/format-context";
import { getShipping, SHIPPING_OPTIONS, ShippingId } from "@/lib/shipping";
import { computeTotals } from "@/lib/pricing";
import { PAYMENT_OPTIONS, type PaymentMethodId } from "@/lib/payments";
import type { Opt } from "@/lib/locations"; // type-only, so the JSON isn't bundled
import { COMPANY } from "@/lib/company";
import { RwandaTinInput } from "@/components/ui/rwanda-tin-input";
import { isValidRwandaTin } from "@/lib/rwanda-tin";
import { CheckoutProgress } from "@/components/checkout-progress";

const createReservationToken = () => {
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
type CheckoutReservation = Awaited<ReturnType<typeof api.reserveCheckoutStock>>;
function useOptions(
    request: ((signal: AbortSignal) => Promise<Opt[]>) | null,
) {
    const [opts, setOpts] = useState<Opt[]>([]);
    useEffect(() => {
        if (!request) { setOpts([]); return; }
        const ctrl = new AbortController();
        request(ctrl.signal)
            .then(setOpts)
            .catch((error: unknown) => {
                if (!ctrl.signal.aborted) {
                    console.error("Could not load checkout locations", error);
                    setOpts([]);
                }
            });
        return () => ctrl.abort();
    }, [request]);
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
    const { displayMoney, baseCurrency } = useFormatters();
    const { user } = useAuth();
    const { items, ready, clearCart } = useCart();
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("MTN_MOMO");
    const [shippingId, setShippingId] = useState<ShippingId>("pickup");
    const [f, setF] = useState({
        fullName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
        phone: "", tin: "", province: "", district: "", sector: "", street: "", note: "",
    });

    const loadProvinces = useCallback(
        (signal: AbortSignal) => api.getProvinces(signal),
        [],
    );
    const loadDistricts = useCallback(
        (signal: AbortSignal) => api.getDistricts(f.province, signal),
        [f.province],
    );
    const loadSectors = useCallback(
        (signal: AbortSignal) => api.getSectors(f.province, f.district, signal),
        [f.district, f.province],
    );
    const provinces = useOptions(loadProvinces);
    const districts = useOptions(f.province ? loadDistricts : null);
    const sectors = useOptions(
        f.province && f.district ? loadSectors : null,
    );
    const [error, setError] = useState("");
    const [tinError, setTinError] = useState("");
    const [busy, setBusy] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [coupon, setCoupon] = useState<CouponValidation | null>(null);
    const [couponError, setCouponError] = useState("");
    const [couponBusy, setCouponBusy] = useState(false);
    const [reservationToken, setReservationToken] = useState("");
    const [reservationExpiresAt, setReservationExpiresAt] = useState("");
    const [reservationBusy, setReservationBusy] = useState(false);
    const [reservationError, setReservationError] = useState("");
    const reservationTokenRef = useRef("");
    const reservationRequestRef = useRef<{
        key: string;
        promise: Promise<CheckoutReservation>;
    } | null>(null);
    const reservationItems = useMemo(
        () => items.map((item) => ({
            variantId: item.variantId,
            saleType: item.saleType,
            qty: item.qty,
        })),
        [items],
    );
    const reservationKey = JSON.stringify(reservationItems);

    const reserveStock = useCallback(async (token?: string) => {
        const reservation = await api.reserveCheckoutStock({
            items: reservationItems,
            ...(token ? { reservationToken: token } : {}),
        });
        reservationTokenRef.current = reservation.reservationToken;
        setReservationToken(reservation.reservationToken);
        setReservationExpiresAt(reservation.expiresAt);
        setReservationError("");
    }, [reservationItems]);

    async function retryStockHold() {
        const token = reservationTokenRef.current || createReservationToken();
        reservationTokenRef.current = token;
        setReservationBusy(true);
        try {
            await reserveStock(token);
        } catch (retryError) {
            setReservationError(
                apiErrorMessage(retryError, "Some items could not be reserved. Update your order and try again."),
            );
        } finally {
            setReservationBusy(false);
        }
    }

    useEffect(() => {
        if (!ready || reservationItems.length === 0) return;
        let active = true;
        setReservationBusy(true);
        setReservationToken("");
        setReservationError("");
        let request = reservationRequestRef.current;
        if (!request || request.key !== reservationKey) {
            const token = reservationTokenRef.current || createReservationToken();
            reservationTokenRef.current = token;
            const previous = request?.promise;
            const promise = previous
                ? previous.catch(() => null).then(() =>
                    api.reserveCheckoutStock({
                        items: reservationItems,
                        reservationToken: token,
                    }),
                )
                : api.reserveCheckoutStock({
                    items: reservationItems,
                    reservationToken: token,
                });
            request = { key: reservationKey, promise };
            reservationRequestRef.current = request;
        }
        void request.promise.then((reservation) => {
            if (!active) return;
            reservationTokenRef.current = reservation.reservationToken;
            setReservationToken(reservation.reservationToken);
            setReservationExpiresAt(reservation.expiresAt);
        }).catch((reserveError: unknown) => {
            if (!active) return;
            setReservationError(
                apiErrorMessage(reserveError, "Some items could not be reserved. Update your order and try again."),
            );
        }).finally(() => {
            if (active) setReservationBusy(false);
            if (reservationRequestRef.current === request) {
                reservationRequestRef.current = null;
            }
        });
        return () => { active = false; };
    // The serialized item key avoids re-reserving when cart objects are recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, reservationKey]);

    useEffect(() => {
        if (!reservationToken || !reservationExpiresAt) return;
        const refreshDelay = Math.max(
            1_000,
            new Date(reservationExpiresAt).getTime() - Date.now() - 2 * 60_000,
        );
        const timeout = window.setTimeout(() => {
            setReservationBusy(true);
            void reserveStock(reservationToken).catch((reserveError: unknown) => {
                setReservationError(
                    apiErrorMessage(reserveError, "Your stock hold could not be renewed."),
                );
                setReservationToken("");
            }).finally(() => setReservationBusy(false));
        }, refreshDelay);
        return () => window.clearTimeout(timeout);
    }, [reservationExpiresAt, reservationToken, reserveStock]);

    const set = (k: keyof typeof f) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setF((p) => ({ ...p, [k]: e.target.value }));

    async function applyCoupon() {
        if (!couponCode.trim()) {
            setCouponError("Enter a coupon code.");
            return;
        }
        setCouponBusy(true);
        setCouponError("");
        try {
            const result = await api.validateCoupon({
                code: couponCode,
                items: items.map((item) => ({
                    variantId: item.variantId,
                    saleType: item.saleType,
                    qty: item.qty,
                })),
            });
            setCoupon(result);
            setCouponCode(result.code);
        } catch (validationError) {
            setCoupon(null);
            setCouponError(
                apiErrorMessage(validationError, "Could not validate coupon."),
            );
        } finally {
            setCouponBusy(false);
        }
    }

    const ship = getShipping(shippingId);
    const delivery = ship.fulfillment === "DELIVERY";
    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + (lineOf(item)?.total ?? 0), 0),
        [items],
    );
    const totals = computeTotals([{ price: subtotal, qty: 1 }], ship.fee);
    const discountedTotals = computeTotals(
        [{ price: Math.max(0, totals.subtotal - (coupon?.discount ?? 0)), qty: 1 }],
        ship.fee,
    );

    useEffect(() => {
        setCoupon(null);
        setCouponError("");
    }, [items]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        if (f.tin && !isValidRwandaTin(f.tin)) {
            setTinError("Enter a valid 9-digit Rwanda TIN, or clear the field.");
            return;
        }
        setTinError("");
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
                items: reservationItems,
                reservationToken,
                shippingId,
                paymentMethod,
                fullName: f.fullName, phone: f.phone,
                tin: f.tin || undefined,
                province: delivery ? f.province : undefined,
                district: delivery ? f.district : undefined,
                sector: delivery ? f.sector || undefined : undefined,
                street: delivery ? f.street : undefined,
                note: f.note || undefined,
                couponCode: coupon?.code,
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
                <p className="text-muted-foreground">Your order is empty.</p>
                <Button asChild className="mt-4"><Link href="/#products">Browse tiles</Link></Button>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-6xl px-6 py-12">
            <div className="mb-10">
                <CheckoutProgress currentStep={2} />
            </div>
            <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
                <h1 className="font-playfair text-4xl font-bold">Finish ordering</h1>

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
                            <span className="font-medium">{o.fee ? displayMoney(o.fee, baseCurrency) : "Free"}</span>
                        </label>
                    ))}
                </fieldset>

                <fieldset className="space-y-3 border border-border p-5">
                    <legend className="px-2 font-semibold">Discount code</legend>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            aria-label="Coupon code"
                            autoComplete="off"
                            maxLength={50}
                            value={couponCode}
                            disabled={Boolean(coupon) || couponBusy}
                            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                        />
                        {coupon ? (
                            <Button type="button" variant="outline" onClick={() => { setCoupon(null); setCouponCode(""); setCouponError(""); }}>
                                Remove
                            </Button>
                        ) : (
                            <Button type="button" variant="outline" disabled={couponBusy || !couponCode.trim()} onClick={() => void applyCoupon()}>
                                {couponBusy && <Loader2 className="mr-2 size-4 animate-spin" />}
                                Apply code
                            </Button>
                        )}
                    </div>
                    {coupon && <p className="text-sm text-primary">{coupon.code} applied — {displayMoney(coupon.discount, baseCurrency)} off</p>}
                    {couponError && <p role="alert" className="text-sm text-destructive">{couponError}</p>}
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
                    <RwandaTinInput
                        id="checkout-tin"
                        value={f.tin}
                        onChange={(tin) => {
                            setF((previous) => ({ ...previous, tin }));
                            setTinError("");
                            setError("");
                        }}
                        error={tinError}
                    />

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
                    <PaymentSummary method={paymentMethod} phone={f.phone} total={discountedTotals.total} />
                </fieldset>
            </div>

            <aside className="sticky top-20 space-y-4 border border-border bg-background p-6">
                <h2 className="font-playfair text-xl font-bold">Your order</h2>
                <ul className="space-y-2 text-sm">
                    {items.map((i) => (
                        <li key={i.variantId} className="flex justify-between gap-3">
                            <span className="truncate">{i.qty} × {i.name} <span className="text-muted-foreground">({i.size})</span></span>
                            <span>{displayMoney(i.pricePerSqm * i.qty, i.currency ?? baseCurrency)}</span>
                        </li>
                    ))}
                </ul>
                <dl className="space-y-2 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{displayMoney(totals.subtotal, baseCurrency)}</dd></div>
                    {coupon && <div className="flex justify-between text-primary"><dt>Discount ({coupon.code})</dt><dd>−{displayMoney(coupon.discount, baseCurrency)}</dd></div>}
                    <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{totals.shippingFee ? displayMoney(totals.shippingFee, baseCurrency) : "Free"}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">VAT (18%)</dt><dd>{displayMoney(discountedTotals.tax, baseCurrency)}</dd></div>
                    <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Total</dt><dd>{displayMoney(discountedTotals.total, baseCurrency)}</dd></div>
                    <p className="text-xs text-muted-foreground">
                        Ordering and payment are processed in {baseCurrency}. Display currency changes do not change the amount charged.
                    </p>
                </dl>
                <FormError message={error || reservationError} />
                {reservationError && !reservationToken && (
                    <Button type="button" variant="outline" className="w-full rounded-none" disabled={reservationBusy} onClick={() => void retryStockHold()}>
                        {reservationBusy && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Retry stock check
                    </Button>
                )}
                <p aria-live="polite" className="text-xs text-muted-foreground">
                    {reservationBusy
                        ? "Checking and holding available stock…"
                        : reservationToken
                            ? `Stock is reserved until ${new Date(reservationExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
                            : "Stock has not been reserved yet."}
                </p>
                <Button type="submit" className="w-full" disabled={busy || reservationBusy || !reservationToken}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {busy ? "Finishing your order…" : "Finish ordering"}
                </Button>
                <p className="text-xs text-muted-foreground">
                    Our team will contact you to confirm payment (MTN MoMo, Airtel Money, card or bank transfer).
                    Need help? Call {COMPANY.phone}.
                </p>
            </aside>
            </div>
        </form>
    );
}

export default function CheckoutPage() {
    return <ProtectedRoute><CheckoutForm /></ProtectedRoute>;
}