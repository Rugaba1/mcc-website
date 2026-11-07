"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  api,
  apiErrorMessage,
  type AdminOrderCreationOptions,
  type AdminOrderCreationInput,
} from "@/lib/api";
import { computeTotals } from "@/lib/pricing";
import { calculateDeliveryFee, DELIVERY_FEE_PER_SQM } from "@/lib/shipping";
import type { Opt } from "@/lib/locations";
import { canSellByContainer, priceLine } from "@/lib/sale-pricing";
import { useFormatters } from "@/contexts/format-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PhoneInput } from "@/components/ui/phone-input";
import { RwandaTinInput } from "@/components/ui/rwanda-tin-input";
import { DateTimePicker } from "@/components/ui/date-picker";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: number) => void;
};

type DraftLine = {
  key: number;
  variantId: string;
  productName: string;
  saleType: "SQM" | "CONTAINER";
  quantity: string;
};

const localDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const newLine = (): DraftLine => ({
  key: Date.now() + Math.random(),
  variantId: "",
  productName: "",
  saleType: "SQM",
  quantity: "1",
});

function useLocationOptions(
  request: ((signal: AbortSignal) => Promise<Opt[]>) | null,
  errorMessage: string,
) {
  const [options, setOptions] = useState<Opt[]>([]);

  useEffect(() => {
    if (!request) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    request(controller.signal)
      .then(setOptions)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(errorMessage, error);
          toast.error(apiErrorMessage(error, errorMessage));
          setOptions([]);
        }
      });

    return () => controller.abort();
  }, [errorMessage, request]);

  return options;
}

export function CreateOrderDialog({ open, onOpenChange, onCreated }: Props) {
  const { money, number } = useFormatters();
  const [options, setOptions] = useState<AdminOrderCreationOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerKey, setCustomerKey] = useState("new");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tin, setTin] = useState("");
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [street, setStreet] = useState("");
  const [shipNotes, setShipNotes] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [providerRef, setProviderRef] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paidAt, setPaidAt] = useState(localDateTime);

  const loadProvinces = useCallback(
    (signal: AbortSignal) => api.getProvinces(signal),
    [],
  );
  const loadDistricts = useCallback(
    (signal: AbortSignal) => api.getDistricts(province, signal),
    [province],
  );
  const loadSectors = useCallback(
    (signal: AbortSignal) => api.getSectors(province, district, signal),
    [district, province],
  );
  const provinces = useLocationOptions(
    open ? loadProvinces : null,
    "Could not load provinces",
  );
  const districts = useLocationOptions(
    open && province ? loadDistricts : null,
    "Could not load districts",
  );
  const sectors = useLocationOptions(
    open && province && district ? loadSectors : null,
    "Could not load sectors",
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingOptions(true);
    api
      .getAdminOrderCreationOptions()
      .then((data) => active && setOptions(data))
      .catch((error) =>
        active && toast.error(apiErrorMessage(error, "Could not load order options")),
      )
      .finally(() => active && setLoadingOptions(false));
    return () => {
      active = false;
    };
  }, [open]);

  const selectedCustomer = options?.customers.find(
    (customer) => customer.key === customerKey,
  );
  useEffect(() => {
    if (!selectedCustomer) return;
    setCustomerName(
      [selectedCustomer.firstName, selectedCustomer.lastName]
        .filter(Boolean)
        .join(" "),
    );
    setEmail(selectedCustomer.email ?? "");
    setPhone(selectedCustomer.phoneNumber ?? "");
    setTin(selectedCustomer.tin ?? "");
  }, [selectedCustomer]);

  const pricedLines = useMemo(
    () =>
      lines.map((line) => {
        const variant = options?.variants.find(
          (item) => String(item.id) === line.variantId,
        );
        if (!variant) {
          return {
            line,
            variant,
            total: null as number | null,
            sqm: 0,
          };
        }
        try {
          const priced = priceLine(
            variant,
            line.saleType,
            Number(line.quantity),
          );
          return { line, variant, total: priced.total, sqm: priced.sqm };
        } catch {
          return { line, variant, total: null as number | null, sqm: 0 };
        }
      }),
    [lines, options],
  );
  const subtotal = pricedLines.reduce((sum, item) => sum + (item.total ?? 0), 0);
  const totalSqm = pricedLines.reduce((sum, item) => sum + item.sqm, 0);
  const deliveryFee =
    fulfillment === "DELIVERY" ? calculateDeliveryFee(totalSqm) : 0;
  const totals = computeTotals(
    subtotal ? [{ price: subtotal, qty: 1 }] : [],
    deliveryFee,
  );

  useEffect(() => {
    if (customerKey !== "new") return;
    setCustomerName("");
    setEmail("");
    setPhone("");
    setTin("");
  }, [customerKey]);

  function reset() {
    setCustomerKey("new");
    setCustomerName("");
    setEmail("");
    setPhone("");
    setTin("");
    setFulfillment("PICKUP");
    setProvince("");
    setDistrict("");
    setSector("");
    setStreet("");
    setShipNotes("");
    setCustomerNote("");
    setInternalNote("");
    setLines([newLine()]);
    setRecordPayment(false);
    setPaymentAmount("");
    setPaymentMethod("CASH_ON_DELIVERY");
    setProviderRef("");
    setPayerPhone("");
    setPaymentNote("");
    setPaidAt(localDateTime());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!options) return;
    if (customerKey !== "new" && !selectedCustomer) {
      toast.error("The selected customer is no longer available. Reload the customer list.");
      return;
    }
    const items = lines.map((line) => ({
      variantId: Number(line.variantId),
      productName: line.productName.trim(),
      saleType: line.saleType,
      quantity: Number(line.quantity),
    }));
    if (
      items.some(
        (item) =>
          !item.variantId ||
          !item.productName ||
          !Number.isFinite(item.quantity),
      )
    ) {
      toast.error("Choose a product, enter its invoice name, and provide a valid quantity");
      return;
    }
    if (
      fulfillment === "DELIVERY" &&
      (!province.trim() || !district.trim() || !street.trim())
    ) {
      toast.error("Province, district and street are required for delivery");
      return;
    }
    if (recordPayment && (!Number(paymentAmount) || !paidAt)) {
      toast.error("Enter the amount and date received for the payment");
      return;
    }

    const payload: AdminOrderCreationInput = {
      customerKind: selectedCustomer?.kind ?? "NEW",
      ...(selectedCustomer ? { customerId: selectedCustomer.id } : {}),
      customerName,
      email,
      phone,
      tin,
      fulfillment,
      province,
      district,
      sector,
      street,
      shipNotes,
      customerNote,
      internalNote,
      items,
      ...(recordPayment
        ? {
            initialPayment: {
              amount: Number(paymentAmount),
              method: paymentMethod,
              providerRef,
              payerPhone,
              note: paymentNote,
              paidAt: new Date(paidAt).toISOString(),
            },
          }
        : {}),
    };

    setSaving(true);
    try {
      const created = await api.createAdminOrder(payload);
      reset();
      onOpenChange(false);
      if (!created.invoice) {
        toast.warning("Order created, but the invoice could not be generated. You can retry from the order page.");
      } else {
        toast.success(`Order ${created.orderNumber} created`);
      }
      onCreated(created.id);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not create order"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b p-5 pr-12 text-left">
          <DialogTitle>Create order</DialogTitle>
          <DialogDescription>
            Create an order for an existing account, saved contact, or new walk-in customer.
          </DialogDescription>
        </DialogHeader>
        {loadingOptions ? (
          <div className="flex min-h-0 flex-1 items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading customers and catalog…
          </div>
        ) : !options ? (
          <div className="p-6 text-sm text-destructive">
            Order options are unavailable. Close this dialog and try again.
          </div>
        ) : (
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1 overflow-hidden">
              <div className="space-y-6 p-5">
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="walkin-customer">Customer</Label>
                  <Select value={customerKey} onValueChange={setCustomerKey}>
                    <SelectTrigger id="walkin-customer" className="w-full rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="new">New walk-in customer</SelectItem>
                      {options.customers.map((customer) => (
                        <SelectItem key={customer.key} value={customer.key}>
                          {[customer.firstName, customer.lastName].filter(Boolean).join(" ")}
                          {" · "}
                          {customer.email ?? customer.phoneNumber ?? "No contact"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-customer-name">Full name *</Label>
                  <Input
                    id="order-customer-name"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    required
                    minLength={2}
                    maxLength={240}
                    readOnly={!!selectedCustomer}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-customer-phone">Phone *</Label>
                  <PhoneInput
                    id="order-customer-phone"
                    value={phone}
                    onChange={setPhone}
                    international
                    defaultCountry="RW"
                    countryCallingCodeEditable={false}
                    required
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-customer-email">Email (optional)</Label>
                  <Input
                    id="order-customer-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    maxLength={254}
                    readOnly={!!selectedCustomer?.email}
                  />
                </div>
                <div className="sm:col-span-2">
                  <RwandaTinInput
                    id="order-customer-tin"
                    value={tin}
                    onChange={setTin}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Order items</h3>
                    <p className="text-xs text-muted-foreground">
                      Prices are taken from the active catalog and cannot be changed here.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLines((current) => [...current, newLine()])}
                  >
                    <Plus /> Add item
                  </Button>
                </div>
                <div className="space-y-3">
                  {pricedLines.map(({ line, variant, total }) => (
                    <div
                      key={line.key}
                      className="grid items-end gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_140px_130px_120px_36px]"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor={`order-variant-${line.key}`}>Product / size</Label>
                        <Select
                          value={line.variantId || undefined}
                          onValueChange={(value) =>
                            setLines((current) => {
                              const selectedVariant = options.variants.find(
                                (item) => String(item.id) === value,
                              );
                              return current.map((item) =>
                                item.key === line.key
                                  ? {
                                      ...item,
                                      variantId: value,
                                      productName: selectedVariant?.productName ?? "",
                                    }
                                  : item,
                              );
                            })
                          }
                        >
                          <SelectTrigger id={`order-variant-${line.key}`} className="w-full rounded-none">
                            <SelectValue placeholder="Choose a product" />
                          </SelectTrigger>
                          <SelectContent className="rounded-none">
                            {options.variants.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.productName} · {item.size} · {item.sku}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {variant && (
                          <div className="space-y-1.5">
                            <Label htmlFor={`order-product-name-${line.key}`}>
                              Name on proforma invoice
                            </Label>
                            <Input
                              id={`order-product-name-${line.key}`}
                              value={line.productName}
                              onChange={(event) =>
                                setLines((current) =>
                                  current.map((item) =>
                                    item.key === line.key
                                      ? { ...item, productName: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                              maxLength={255}
                              required
                            />
                          </div>
                        )}
                        {variant && (
                          <p className="text-xs text-muted-foreground">
                            {money(variant.pricePerSqm, options.currency.code)}/m²
                            {variant.inventory
                              ? ` · Available ${number(
                                  Math.max(
                                    0,
                                    variant.inventory.onHandSqm -
                                      variant.inventory.reservedSqm,
                                  ),
                                  { maximumFractionDigits: 2 },
                                )} m²`
                              : " · Stock record missing"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`order-sale-${line.key}`}>Sale type</Label>
                        <Select
                          value={line.saleType}
                          onValueChange={(value: "SQM" | "CONTAINER") =>
                            setLines((current) =>
                              current.map((item) =>
                                item.key === line.key
                                  ? { ...item, saleType: value }
                                  : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`order-sale-${line.key}`} className="w-full rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none">
                            <SelectItem value="SQM">Square metres</SelectItem>
                            {variant && canSellByContainer(variant) && (
                              <SelectItem value="CONTAINER">Containers</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`order-quantity-${line.key}`}>
                          {line.saleType === "SQM" ? "Quantity (m²)" : "Containers"}
                        </Label>
                        <Input
                          id={`order-quantity-${line.key}`}
                          type="number"
                          min={line.saleType === "SQM" ? "1" : "1"}
                          step={line.saleType === "SQM" ? "0.01" : "1"}
                          value={line.quantity}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((item) =>
                                item.key === line.key
                                  ? { ...item, quantity: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          required
                        />
                      </div>
                      <div className="pb-2 text-right text-sm font-medium tabular-nums">
                        {total == null ? "—" : money(total, options.currency.code)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove item"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((current) => current.filter((item) => item.key !== line.key))
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="order-fulfillment">Fulfillment</Label>
                  <Select
                    value={fulfillment}
                    onValueChange={(value: "PICKUP" | "DELIVERY") => setFulfillment(value)}
                  >
                    <SelectTrigger id="order-fulfillment" className="w-full rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="PICKUP">Customer pickup</SelectItem>
                      <SelectItem value="DELIVERY">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fulfillment === "DELIVERY" && (
                  <p className="self-center text-sm text-muted-foreground">
                    Delivery: {number(totalSqm, { maximumFractionDigits: 2 })} m² ×{" "}
                    {money(DELIVERY_FEE_PER_SQM, options.currency.code)}/m²
                  </p>
                )}
                {fulfillment === "DELIVERY" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="order-province">Province *</Label>
                      <Select
                        value={province}
                        onValueChange={(value) => {
                          setProvince(value);
                          setDistrict("");
                          setSector("");
                        }}
                        required
                      >
                        <SelectTrigger id="order-province" className="w-full rounded-none">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {provinces.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="order-district">District *</Label>
                      <Select
                        value={district}
                        onValueChange={(value) => {
                          setDistrict(value);
                          setSector("");
                        }}
                        disabled={!province}
                        required
                      >
                        <SelectTrigger id="order-district" className="w-full rounded-none">
                          <SelectValue placeholder={province ? "Select district" : "Select province first"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {districts.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="order-sector">Sector (optional)</Label>
                      <Select
                        value={sector}
                        onValueChange={setSector}
                        disabled={!district}
                      >
                        <SelectTrigger id="order-sector" className="w-full rounded-none">
                          <SelectValue placeholder={district ? "Select sector" : "Select district first"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {sectors.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="order-street">Street / site address *</Label>
                      <Input id="order-street" value={street} onChange={(e) => setStreet(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="order-delivery-notes">Delivery notes</Label>
                      <Textarea id="order-delivery-notes" value={shipNotes} onChange={(e) => setShipNotes(e.target.value)} maxLength={2000} />
                    </div>
                  </>
                )}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="order-customer-note">Customer note</Label>
                  <Textarea id="order-customer-note" value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} maxLength={2000} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="order-internal-note">Internal note (staff only)</Label>
                  <Textarea id="order-internal-note" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} maxLength={5000} />
                </div>
              </section>

              <PermissionGate required={PERM.PAYMENTS_RECORD}>
                <section className="space-y-3 rounded-md border p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Checkbox
                      id="order-record-payment"
                      checked={recordPayment}
                      onCheckedChange={(checked) => setRecordPayment(checked === true)}
                    />
                    <Label htmlFor="order-record-payment">
                      Record a payment with this order
                    </Label>
                  </div>
                  {recordPayment && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="order-payment-amount">Amount received</Label>
                        <Input id="order-payment-amount" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="order-payment-method">Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger id="order-payment-method" className="w-full rounded-none"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-none">
                            {[
                              ["CASH_ON_DELIVERY", "Cash"],
                              ["MTN_MOMO", "MTN MoMo"],
                              ["AIRTEL_MONEY", "Airtel Money"],
                              ["BANK_TRANSFER", "Bank transfer"],
                              ["CARD", "Card"],
                            ].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="order-payment-reference">Reference (optional)</Label>
                        <Input id="order-payment-reference" value={providerRef} onChange={(e) => setProviderRef(e.target.value)} maxLength={150} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="order-payment-date">Received at</Label>
                        <DateTimePicker
                          id="order-payment-date"
                          value={paidAt}
                          onChange={setPaidAt}
                          allowPast
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="order-payment-phone">Payer phone (optional)</Label>
                        <PhoneInput
                          id="order-payment-phone"
                          className="rounded-none"
                          value={payerPhone}
                          onChange={setPayerPhone}
                          international
                          defaultCountry="RW"
                          countryCallingCodeEditable={false}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="order-payment-note">Payment note (optional)</Label>
                        <Input id="order-payment-note" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} maxLength={255} />
                      </div>
                    </div>
                  )}
                </section>
              </PermissionGate>

              <div className="ml-auto max-w-sm space-y-1 border-t pt-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(subtotal, options.currency.code)}</span></div>
                {fulfillment === "DELIVERY" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Delivery ({number(totalSqm, { maximumFractionDigits: 2 })} m² × {DELIVERY_FEE_PER_SQM}/m²)
                    </span>
                    <span>{money(deliveryFee, options.currency.code)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span>{money(totals.tax, options.currency.code)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>{money(totals.total, options.currency.code)}</span></div>
              </div>
              </div>
            </ScrollArea>
            <DialogFooter className="shrink-0 border-t bg-background p-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !options.variants.length}>
                {saving && <Loader2 className="animate-spin" />}
                Create order
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
