"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type CustomerDetail, type CustomerSummary } from "@/lib/api";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/status-badge";
import { useFormatters } from "@/contexts/format-context";

function CustomerView({ row }: { row: CustomerSummary }) {
  const { money, date } = useFormatters();
  const [c, setC] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    setC(null);
    api.getCustomer(row.id).then(setC).catch((e) => toast.error(apiErrorMessage(e, "Failed to load customer")));
  }, [row.id]);

  if (!c) return <Loader2 className="mx-auto mt-10 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 border">
        {[["Orders", c.orderCount], ["Total spent", money(c.totalSpent)], ["Last order", date(c.lastOrderAt)]].map(([k, v]) => (
          <div key={String(k)} className="border-r p-3 last:border-r-0"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-semibold tabular-nums">{v}</p></div>
        ))}
      </div>

      <section className="space-y-1 text-sm">
        <h3 className="font-semibold">Contact</h3>
        <p>{c.email}</p>
        <p className="text-muted-foreground">{c.phoneNumber ?? "No phone number"} · joined {date(c.createdAt)} · {c.isActive ? "active" : "disabled"}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Addresses ({c.addresses.length})</h3>
        {c.addresses.length === 0 ? <p className="text-sm text-muted-foreground">No saved addresses.</p> : c.addresses.map((a) => (
          <div key={a.id} className="border p-3 text-sm">
            <p className="font-medium">{a.label ?? "Address"} · {a.fullName}</p>
            <p className="text-muted-foreground">{[a.street, a.sector, a.district].filter(Boolean).join(", ")} · {a.phone}</p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Orders ({c.orders.length})</h3>
        {c.orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : c.orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-3 border p-3 text-sm">
            <div><p className="font-medium">{o.orderNumber}</p><p className="text-xs text-muted-foreground">{date(o.placedAt)} · {o.itemCount} item(s)</p></div>
            <div className="flex items-center gap-2"><StatusBadge status={o.status} /><span className="tabular-nums">{money(o.grandTotal, o.currency)}</span></div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function AdminCustomersPage() {
  const { money, date } = useFormatters();
  return (
    <ResourcePage<CustomerSummary>
      title="Customers"
      description="Accounts that have placed an order. Accounts without orders are listed under Users."
      entityName="customer"
      loadPage={api.getCustomersPage}
      filters={[
        { key: "orders", label: "Customers", options: [{ value: "buyers", label: "Has ordered" }, { value: "none", label: "Never ordered" }] },
      ]}
      columns={[
        { header: "Customer", cell: (c) => <div><p className="font-medium">{`${c.firstName} ${c.lastName ?? ""}`.trim()}</p><p className="text-xs text-muted-foreground">{c.email}</p></div> },
        { header: "Phone", cell: (c) => c.phoneNumber ?? "—" },
        { header: "Orders", className: "text-right", cell: (c) => <span className="tabular-nums">{c.orderCount}</span> },
        { header: "Total spent", className: "text-right", cell: (c) => <span className="font-medium tabular-nums">{money(c.totalSpent)}</span> },
        { header: "Last order", cell: (c) => date(c.lastOrderAt) },
        { header: "Joined", cell: (c) => date(c.createdAt) },
      ]}
      detail={{
        title: (c) => `${c.firstName} ${c.lastName ?? ""}`.trim(),
        description: (c) => c.email,
        render: (c) => <CustomerView row={c} />,
      }}
    />
  );
}