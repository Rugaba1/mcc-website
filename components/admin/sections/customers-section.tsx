"use client";

import { useState } from "react";
import { api, type CustomerDetail, type CustomerSummary } from "@/lib/api";
import { useFormatters } from "@/contexts/format-context";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../fields";

export function CustomersSection({ customers }: { customers: CustomerSummary[] }) {
  const { money, date } = useFormatters();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const visible = customers.filter((c) =>
    `${c.firstName} ${c.lastName ?? ""} ${c.email} ${c.phoneNumber ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  async function open(id: number) {
    setLoading(true);
    setError("");
    try {
      setSelected(await api.getCustomer(id));
    } catch {
      setError("Could not load customer details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Customers</h2>
          <p className="text-sm text-muted-foreground">{customers.length} customer accounts</p>
        </div>
        <Input aria-label="Search customers" placeholder="Search name, email, phone" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-72" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left">
              {["Customer", "Phone", "Orders", "Lifetime spend"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase">{h}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((c) => (
              <tr key={c.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </td>
                <td className="px-4 py-3">{c.phoneNumber ?? "—"}</td>
                <td className="px-4 py-3">{c.orderCount}</td>
                <td className="px-4 py-3">{money(c.totalSpent)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => void open(c.id)}>View</Button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No matching customers.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading customer…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {selected && (
        <section className="space-y-4 rounded-lg border border-border bg-background p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{selected.firstName} {selected.lastName}</h3>
              <p className="text-sm text-muted-foreground">{selected.email} · {selected.phoneNumber ?? "No phone"}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Orders", String(selected.orderCount)],
              ["Lifetime spend", money(selected.totalSpent)],
              ["Customer since", date(selected.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Addresses</h4>
            {selected.addresses.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {selected.addresses.map((a) => (
                  <li key={a.id} className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium">{a.label ?? a.fullName}</p>
                    <p className="text-muted-foreground">{[a.street, a.sector, a.district].filter(Boolean).join(", ")}</p>
                    <p className="text-muted-foreground">{a.phone}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No saved addresses.</p>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Recent orders</h4>
            {selected.orders.length ? (
              <ul className="divide-y divide-border">
                {selected.orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="font-medium">{o.orderNumber}</span>
                    <span className="text-muted-foreground">{date(o.placedAt)}</span>
                    <Badge variant="outline">{o.status}</Badge>
                    <span>{money(o.grandTotal, o.currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}