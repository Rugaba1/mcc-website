"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type OrderDetail, type OrderSummary } from "@/lib/api";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, fmtDateTime, money, options, pretty } from "@/lib/format";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const PAYMENT_STATUSES = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];

function OrderView({ row, reload }: { row: OrderSummary; reload: () => Promise<void> }) {
  const [o, setO] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState(row.status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const d = await api.getOrder(row.id);
    setO(d);
    setStatus(d.status);
    setNote(d.internalNote ?? "");
  }, [row.id]);

  useEffect(() => {
    setO(null);
    load().catch((e) => toast.error(apiErrorMessage(e, "Failed to load order")));
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateOrder(row.id, { status, internalNote: note.trim() || null });
      toast.success("Order updated");
      await Promise.all([load(), reload()]);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the order"));
    } finally {
      setSaving(false);
    }
  };

  if (!o) return <Loader2 className="mx-auto mt-10 animate-spin text-muted-foreground" />;
  const dirty = status !== o.status || note.trim() !== (o.internalNote ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.paymentStatus} /><span className="text-sm text-muted-foreground">{pretty(o.fulfillment)} · placed {fmtDateTime(o.placedAt)}</span></div>

      <section className="space-y-3 border p-4">
        <h3 className="text-sm font-semibold">Manage order</h3>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none">{STATUSES.map((s) => <SelectItem key={s} value={s} className="rounded-none">{pretty(s)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Internal note (staff only)</Label><Textarea className="rounded-none" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <Button className="rounded-none" onClick={save} disabled={saving || !dirty}>{saving && <Loader2 className="animate-spin" />}Save changes</Button>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Items</h3>
        <div className="divide-y border text-sm">
          {o.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0"><p className="truncate font-medium">{i.productName}</p><p className="text-xs text-muted-foreground">{i.sku} · {i.size} · {i.quantity} × {money(i.unitPrice)}</p></div>
              <span className="tabular-nums">{money(i.lineTotal)}</span>
            </div>
          ))}
          <div className="space-y-1 bg-muted/40 p-3 text-sm">
            {([["Subtotal", o.subtotal], ["Discount", -o.discountTotal], ["Shipping", o.shippingFee], ["Tax", o.taxTotal]] as const).filter(([, v]) => v !== 0).map(([k, v]) => (
              <div key={k} className="flex justify-between text-muted-foreground"><span>{k}</span><span className="tabular-nums">{money(v, o.currency)}</span></div>
            ))}
            <div className="flex justify-between font-semibold"><span>Total</span><span className="tabular-nums">{money(o.grandTotal, o.currency)}</span></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1"><h3 className="font-semibold">Customer</h3><p>{o.customerName}</p><p className="text-muted-foreground">{o.email ?? "—"} · {o.phone ?? "—"}</p>{o.customerNote && <p className="border-l-2 pl-2 text-muted-foreground">“{o.customerNote}”</p>}</div>
        <div className="space-y-1"><h3 className="font-semibold">Ship to</h3>{o.shipFullName ? <><p>{o.shipFullName} · {o.shipPhone}</p><p className="text-muted-foreground">{[o.shipStreet, o.shipSector, o.shipDistrict].filter(Boolean).join(", ")}</p></> : <p className="text-muted-foreground">Pickup, no address</p>}</div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Payments</h3>
        {o.payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded.</p> : o.payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between border p-3 text-sm"><span>{pretty(p.method)}</span><span className="flex items-center gap-2"><StatusBadge status={p.status} /><span className="tabular-nums">{money(p.amount, p.currency)}</span></span></div>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">History</h3>
        <ol className="space-y-3 border-l pl-4">
          {o.history.map((h) => (
            <li key={h.id} className="text-sm"><StatusBadge status={h.status} /><p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(h.createdAt)}{h.note ? ` · ${h.note}` : ""}</p></li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <ResourcePage<OrderSummary>
      title="Orders"
      description="Review, fulfil and update customer orders."
      entityName="order"
      load={api.getOrders}
      searchText={(o) => `${o.orderNumber} ${o.customerName} ${o.email ?? ""} ${o.phone ?? ""}`}
      filters={[
        { key: "status", label: "Statuses", options: options(STATUSES), match: (o, v) => o.status === v },
        { key: "payment", label: "Payments", options: options(PAYMENT_STATUSES), match: (o, v) => o.paymentStatus === v },
      ]}
      columns={[
        { header: "Order", cell: (o) => <span className="font-medium">{o.orderNumber}</span> },
        { header: "Customer", cell: (o) => <div><p>{o.customerName}</p><p className="text-xs text-muted-foreground">{o.email ?? o.phone ?? ""}</p></div> },
        { header: "Items", className: "text-right", cell: (o) => <span className="tabular-nums">{o.itemCount}</span> },
        { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
        { header: "Payment", cell: (o) => <StatusBadge status={o.paymentStatus} /> },
        { header: "Total", className: "text-right", cell: (o) => <span className="font-medium tabular-nums">{money(o.grandTotal)}</span> },
        { header: "Placed", cell: (o) => fmtDate(o.placedAt) },
      ]}
      detail={{ title: (o) => o.orderNumber, description: (o) => o.customerName, render: (o, { reload }) => <OrderView row={o} reload={reload} /> }}
    />
  );
}