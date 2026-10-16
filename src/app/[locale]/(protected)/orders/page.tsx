"use client";

import { Link } from "@/app/i18n/routing";
import { api, type MyOrderSummary } from "@/lib/api";
import { money } from "@/lib/format";
import { useResource } from "@/hooks/use-resource";
import { StatusBadge } from "@/components/account/status-badge";
import { Button } from "@/components/ui/button";

const fetchOrders = () => api.getMyOrders();

export default function OrdersPage() {
  const { data, loading, error } = useResource<MyOrderSummary[]>(fetchOrders, []);

  return (
    <div className="space-y-5">
      <h1 className="font-playfair text-3xl font-bold">My orders</h1>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          You haven&apos;t placed an order yet.
          <div className="mt-3"><Button asChild><Link href="/#products">Browse tiles</Link></Button></div>
        </div>
      )}
      {data.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left">
                {["Order", "Placed", "Items", "Total", "Status", "Payment"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold"><Link href={`/orders/${o.id}`} className="text-primary hover:underline">{o.orderNumber}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.placedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{o.itemCount}</td>
                  <td className="px-4 py-3 font-medium">{money(o.grandTotal, o.currency)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}