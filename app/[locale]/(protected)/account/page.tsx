"use client";

import { Link } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { api, type MyOrderSummary } from "@/lib/api";
import { money } from "@/lib/format";
import { useResource } from "@/hooks/use-resource";
import { StatusBadge } from "@/components/account/status-badge";
import { Button } from "@/components/ui/button";

const fetchOrders = () => api.getMyOrders();

export default function AccountPage() {
  const { user } = useAuth();
  const orders = useResource<MyOrderSummary[]>(fetchOrders, []);
  const open = orders.data.filter((o) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.status)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-playfair text-3xl font-bold">Welcome, {user?.firstName}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total orders", orders.loading ? "…" : String(orders.data.length)],
          ["In progress", orders.loading ? "…" : String(open)],
          ["Total spent", orders.loading ? "…" : money(orders.data.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + o.grandTotal, 0))],
        ].map(([label, value]) => (
          <div key={label} className="border border-border bg-background p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {orders.data.length === 0 && !orders.loading ? (
          <div className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No orders yet. <Button asChild variant="link"><Link href="/#products">Browse tiles</Link></Button>
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border bg-background">
            {orders.data.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm hover:bg-muted/40">
                  <span className="font-semibold">{o.orderNumber}</span>
                  <span className="text-muted-foreground">{new Date(o.placedAt).toLocaleDateString()}</span>
                  <StatusBadge status={o.status} />
                  <span>{money(o.grandTotal, o.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}