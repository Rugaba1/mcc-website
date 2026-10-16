"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, type OrderDetail, type OrderSummary } from "@/lib/api";
import { money } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "../fields";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export function OrdersSection({
  orders,
  reload,
}: {
  orders: OrderSummary[];
  reload: () => Promise<void> | void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const visible = orders.filter(
    (o) =>
      (filter === "ALL" || o.status === filter) &&
      `${o.orderNumber} ${o.customerName} ${o.email ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function open(id: number) {
    setLoading(true);
    try {
      const d = await api.getOrder(id);
      setSelected(d);
      setStatus(d.status);
      setNote(d.internalNote ?? "");
    } catch {
      toast.error("Could not load order details");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.updateOrder(selected.id, { status, internalNote: note || null });
      setSelected(await api.getOrder(selected.id));
      toast.success("Order updated");
      await reload();
    } catch {
      toast.error("Order update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Orders</h2>
          <p className="text-sm text-muted-foreground">
            {orders.length} orders · {orders.filter((o) => o.status === "PENDING").length} pending
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input aria-label="Search orders" placeholder="Search order or customer" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-64" />
          <Select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-44">
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left">
              {["Order", "Customer", "Placed", "Items", "Total", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase">{h}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((o) => (
              <tr key={o.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-semibold">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(o.placedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{o.itemCount}</td>
                <td className="px-4 py-3 font-medium">{money(o.grandTotal)}</td>
                <td className="px-4 py-3">
                  <Badge variant={o.status === "CANCELLED" ? "destructive" : "outline"}>{o.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => void open(o.id)}>View</Button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No matching orders.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading order…</p>}

      {selected && (
        <section className="space-y-5 rounded-lg border border-border bg-background p-5" aria-label={`Order ${selected.orderNumber}`}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-bold">{selected.orderNumber}</h3>
              <p className="text-sm text-muted-foreground">{selected.customerName} · {selected.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2">Product</th><th className="py-2">SKU</th><th className="py-2">Qty</th><th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((i) => (
                      <tr key={i.id} className="border-b border-border last:border-0">
                        <td className="py-3">{i.productName}<span className="block text-xs text-muted-foreground">{i.size}</span></td>
                        <td className="py-3">{i.sku}</td>
                        <td className="py-3">{i.quantity}</td>
                        <td className="py-3 text-right">{money(i.lineTotal, selected.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold">Status history</h4>
                {selected.history.length ? (
                  <ol className="space-y-2">
                    {selected.history.map((h) => (
                      <li key={h.id} className="flex gap-3 text-sm">
                        <Badge variant="outline">{h.status}</Badge>
                        <span className="text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString()}{h.note ? ` · ${h.note}` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">No status changes recorded.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-md bg-muted/50 p-4">
              <div>
                <Label>Order status</Label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <Label>Internal note</Label>
                <Textarea rows={4} maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Staff-only order note" />
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Subtotal: {money(selected.subtotal, selected.currency)}</p>
                <p>Shipping: {money(selected.shippingFee, selected.currency)}</p>
                <p>Payment: {selected.paymentStatus}</p>
                <p className="font-bold text-foreground">Total: {money(selected.grandTotal, selected.currency)}</p>
              </div>
              <Button className="w-full" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save order"}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}