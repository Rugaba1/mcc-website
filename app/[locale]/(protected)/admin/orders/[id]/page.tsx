"use client";

import { MediaImage } from "@/components/media-image";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { FileText, Loader2, Mail, Plus } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type InvoiceRef, type OrderDetail } from "@/lib/api";
import { useFormatters } from "@/contexts/format-context";
import { StatusBadge } from "@/components/account/status-badge";
import { InvoiceViewerDialog } from "@/components/invoices/invoice-viewer-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { PaidAtAlertDialog } from "@/components/admin/paid-at-alert-dialog";
import {
  canTransitionOrderStatus,
  ORDER_STATUSES,
  orderStatusDateField,
  orderStatusDateLabel,
  type OrderStatus,
} from "@/lib/orders/status";

const KIND_LABEL: Record<InvoiceRef["kind"], string> = {
  PROFORMA: "Proforma invoice",
  INVOICE: "Invoice",
  CREDIT_NOTE: "Credit note",
};
export default function AdminOrderPage() {
  const { money, number, date, dateTime } = useFormatters();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");
  const [invoice, setInvoice] = useState<InvoiceRef | null>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusDateDialogOpen, setStatusDateDialogOpen] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentReceivedAt, setPaymentReceivedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [emailInvoiceBusy, setEmailInvoiceBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const o = await api.getAdminOrder(Number(id));
      setOrder(o);
      setStatus(o.status);
      setState("ok");
    } catch {
      setState("missing");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveStatus(statusAt?: string): Promise<boolean> {
    if (!order || status === order.status) return false;
    if (!statusAt) {
      setStatusDateDialogOpen(true);
      return false;
    }
    setSaving(true);
    try {
      await api.updateOrderStatus(order.id, status, note.trim() || undefined, statusAt);
      toast.success("Order status updated");
      setNote("");
      await load();
      return true;
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the order"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    setPaymentBusy(true);
    try {
      await api.recordPayment(order.id, {
        method: paymentMethod,
        status: "PAID",
        amount: Number(paymentAmount),
        providerRef: paymentReference.trim() || undefined,
        note: paymentNote.trim() || undefined,
        paidAt: new Date(paymentReceivedAt).toISOString(),
      });
      toast.success("Payment recorded");
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNote("");
      setRecordingPayment(false);
      await load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not record payment"));
    } finally {
      setPaymentBusy(false);
    }
  }

  async function emailInvoice() {
    if (!order) return;
    setEmailInvoiceBusy(true);
    try {
      await api.sendOrderInvoice(order.id);
      toast.success(`Invoice sent to ${order.email}`);
      await load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not send invoice email"));
    } finally {
      setEmailInvoiceBusy(false);
    }
  }

  if (state === "loading") return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  if (state === "missing" || !order) {
    return (
      <p className="p-6 text-sm">
        Order not found. <Link href="/admin/orders" className="text-primary hover:underline">Back to orders</Link>
      </p>
    );
  }

  const c = order.currency;
  const address = [order.shipStreet, order.shipSector, order.shipDistrict, order.shipProvince].filter(Boolean).join(", ");
  const received = order.payments
    .filter((payment) => ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const refunded = order.payments.reduce(
    (sum, payment) => sum + (payment.refundedAmount ?? 0),
    0,
  );
  const balanceDue = Math.max(0, order.grandTotal - received + refunded);

  return (
    <section className="flex-1 space-y-5 p-4 md:p-6">
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">← All orders</Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed {dateTime(order.placedAt)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Items */}
          <Card className="rounded-none">
            {/* <CardHeader><CardTitle>Items ({order.items.length})</CardTitle></CardHeader> */}
            <CardContent className="divide-y p-0">
              {order.items.map((i) => (
                <div key={i.id} className="flex gap-4 p-4 text-sm">
                  <div className="size-14 shrink-0 overflow-hidden border bg-muted">
                    {i.image && (
                      <MediaImage src={i.image} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{i.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[i.size, i.finish].filter(Boolean).join(" · ")} · {i.sku}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {number(i.quantity, { maximumFractionDigits: 2 })} m² × {money(i.unitPrice, c)}/m²
                      {i.saleType === "CONTAINER" && i.containers
                        ? ` · ${i.containers} container${i.containers > 1 ? "s" : ""}`
                        : ""}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">{money(i.lineTotal, c)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Payments</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Balance due: {money(balanceDue, c)}
                </p>
              </div>
              <PermissionGate required={PERM.PAYMENTS_RECORD}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRecordingPayment((value) => !value)}
                  disabled={balanceDue <= 0 || order.status === "CANCELLED" || order.status === "REFUNDED"}
                >
                  <Plus /> Record payment
                </Button>
              </PermissionGate>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {order.payments.length === 0 && <p className="p-4 text-sm text-muted-foreground">No payments recorded.</p>}
              {order.payments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <div>
                    <p className="font-medium capitalize">{p.method.replace(/_/g, " ").toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {[p.provider, p.reference].filter(Boolean).join(" · ") || "—"} ·                       {dateTime(p.paidAt ?? p.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">{money(p.amount, p.currency || c)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
              {recordingPayment && (
                <PermissionGate required={PERM.PAYMENTS_RECORD}>
                  <form onSubmit={recordPayment} className="space-y-3 p-4">
                    <p className="text-sm font-semibold">Record received payment</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="record-payment-amount" className="text-xs font-medium">Amount ({c})</label>
                        <Input id="record-payment-amount" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="record-payment-method" className="text-xs font-medium">Method</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger id="record-payment-method" className="w-full rounded-none"><SelectValue /></SelectTrigger>
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
                        <label htmlFor="record-payment-reference" className="text-xs font-medium">Reference (optional)</label>
                        <Input id="record-payment-reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={150} />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="record-payment-date" className="text-xs font-medium">Received at</label>
                        <Input id="record-payment-date" type="datetime-local" value={paymentReceivedAt} onChange={(event) => setPaymentReceivedAt(event.target.value)} required />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label htmlFor="record-payment-note" className="text-xs font-medium">Note (optional)</label>
                        <Input id="record-payment-note" value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} maxLength={255} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" disabled={paymentBusy}>
                        {paymentBusy && <Loader2 className="animate-spin" />}
                        Save payment
                      </Button>
                    </div>
                  </form>
                </PermissionGate>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card className="rounded-none">
            <CardHeader><CardTitle>History</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {order.history.map((h) => (
                  <li key={h.id} className="flex items-start gap-3">
                    <StatusBadge status={h.status} />
                    <span className="text-xs text-muted-foreground">
                      {dateTime(h.createdAt)}{h.note ? ` · ${h.note}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          {/* Status update */}
          <PermissionGate required={PERM.ORDERS_UPDATE_STATUS}>
            <Card className="rounded-none">
              <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none">
                    {ORDER_STATUSES.filter((candidate) =>
                      candidate === order.status ||
                      canTransitionOrderStatus(order.status as OrderStatus, candidate)
                    ).map((s) => (
                      <SelectItem key={s} value={s} className="rounded-none capitalize">
                        {s.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="rounded-none" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button className="w-full rounded-none" onClick={() => void saveStatus()} disabled={saving || status === order.status}>
                  {saving && <Loader2 className="animate-spin" />} Save status
                </Button>
              </CardContent>
            </Card>
          </PermissionGate>

          {/* Totals */}
          <Card className="rounded-none">
            <CardContent className="space-y-2 p-5 text-sm">
              <Row label="Subtotal" value={money(order.subtotal, c)} />
              {order.discountTotal > 0 && (
                <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${money(order.discountTotal, c)}`} />
              )}
              <Row label="Delivery" value={order.shippingFee ? money(order.shippingFee, c) : "Free"} />
              <Row label="VAT" value={money(order.taxTotal, c)} />
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total</span><span className="tabular-nums">{money(order.grandTotal, c)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card className="rounded-none">
            <CardContent className="space-y-1 p-5 text-sm">
              <p className="font-semibold">Customer</p>
              <p>{order.customerName}</p>
              {order.email && <p className="break-all text-muted-foreground">{order.email}</p>}
              {order.phone && <p className="text-muted-foreground">{order.phone}</p>}
              {order.tin && <p className="text-muted-foreground">Rwanda TIN: {order.tin}</p>}
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card className="rounded-none">
            <CardContent className="space-y-1 p-5 text-sm">
              <p className="font-semibold">{order.fulfillment === "PICKUP" ? "Pick up" : "Deliver to"}</p>
              <p>{order.shipFullName}</p>
              <p className="text-muted-foreground">{order.shipPhone}</p>
              {order.fulfillment === "DELIVERY" && address && <p className="text-muted-foreground">{address}</p>}
              {order.deliveryZone && <p className="text-xs text-muted-foreground">Zone: {order.deliveryZone}</p>}
              {order.shipNotes && <p className="text-xs text-muted-foreground">Notes: {order.shipNotes}</p>}
              {order.customerNote && <p className="pt-2 text-xs"><b>Customer note:</b> {order.customerNote}</p>}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="rounded-none">
              <CardContent className="space-y-2 p-5 text-sm">
                <div className="flex flex-col items-stretch gap-2">
                  <p className="font-semibold">Documents</p>
                  <PermissionGate required={PERM.INVOICES_ISSUE}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-auto w-full min-w-0 justify-start whitespace-normal rounded-none px-3 py-2 text-left"
                      onClick={() => void emailInvoice()}
                      disabled={emailInvoiceBusy || !order.email || order.status === "CANCELLED"}
                    >
                      {emailInvoiceBusy ? <Loader2 className="animate-spin" /> : <Mail />}
                      <span className="min-w-0 break-words">
                        {order.email ? (
                          <>Email invoice to <span className="break-all">{order.email}</span></>
                        ) : (
                          "Customer email required"
                        )}
                      </span>
                    </Button>
                  </PermissionGate>
                </div>
                {!order.invoices.length && (
                  <p className="text-xs text-muted-foreground">
                    No invoice has been generated yet. Sending an email will generate the current document first.
                  </p>
                )}
                {order.invoices.map((inv) => (
                  <PermissionGate key={inv.id} required={PERM.INVOICES_VIEW}>
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start gap-3 rounded-none px-3 py-2 text-left"
                      onClick={() => setInvoice(inv)}
                    >
                      <FileText className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{KIND_LABEL[inv.kind]}</span>
                        <span className="block truncate text-xs font-normal text-muted-foreground">
                          {inv.number} · {date(inv.issuedAt)}
                        </span>
                      </span>
                    </Button>
                  </PermissionGate>
                ))}
              </CardContent>
          </Card>
        </aside>
      </div>

      <InvoiceViewerDialog invoice={invoice} onClose={() => setInvoice(null)} />
      <PaidAtAlertDialog
        open={statusDateDialogOpen}
        onOpenChange={(open) => {
          setStatusDateDialogOpen(open);
          if (!open) setStatus(order.status as OrderStatus);
        }}
        eventLabel={orderStatusDateLabel(status as OrderStatus)}
        minimumDateTime={order.placedAt}
        initialValue={
          orderStatusDateField(status as OrderStatus)
            ? order[orderStatusDateField(status as OrderStatus)!]
            : null
        }
        busy={saving}
        onConfirm={async (statusAt) => {
          if (await saveStatus(statusAt)) setStatusDateDialogOpen(false);
        }}
      />
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}