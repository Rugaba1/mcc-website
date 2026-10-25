"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
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

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
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

  async function saveStatus() {
    if (!order || status === order.status) return;
    setSaving(true);
    try {
      await api.updateOrderStatus(order.id, status, note.trim() || undefined);
      toast.success("Order status updated");
      setNote("");
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the order"));
    } finally {
      setSaving(false);
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

  return (
    <main className="flex-1 space-y-5 p-4 md:p-6">
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt="" className="size-full object-cover" />
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
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
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
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="rounded-none capitalize">
                        {s.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="rounded-none" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button className="w-full rounded-none" onClick={saveStatus} disabled={saving || status === order.status}>
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
              {order.email && <p className="text-muted-foreground">{order.email}</p>}
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
          {order.invoices?.length > 0 && (
            <Card className="rounded-none">
              <CardContent className="space-y-2 p-5 text-sm">
                <p className="font-semibold">Documents</p>
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
          )}
        </aside>
      </div>

      <InvoiceViewerDialog invoice={invoice} onClose={() => setInvoice(null)} />
    </main>
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