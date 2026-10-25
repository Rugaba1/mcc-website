"use client";

import { useState } from "react";
import type { PaymentSummary } from "@/lib/api";
import { useFormatters } from "@/contexts/format-context";
import { Badge } from "../../ui/badge";
import { Input, Select } from "../fields";



export function PaymentsSection({ payments }: { payments: PaymentSummary[] }) {
  const { money, dateTime } = useFormatters();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const STATUSES = [...new Set(payments.map((p) => p.status))].sort();
  const visible = payments.filter(
    (p) =>
      (filter === "ALL" || p.status === filter) &&
      `${p.orderNumber} ${p.customerName} ${p.reference ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const collected = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Payments</h2>
          <p className="text-sm text-muted-foreground">
            {payments.length} payments · {money(collected)} collected
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label="Search payments"
            placeholder="Order, customer or reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Select
            aria-label="Filter by status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="sm:w-40"
          >
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left">
              {["Date", "Order", "Customer", "Method", "Payer", "Reference", "Amount", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((p) => (
              <tr key={p.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 text-muted-foreground">
                  {dateTime(p.createdAt)}
                </td>
                <td className="px-4 py-3 font-semibold">{p.orderNumber}</td>
                <td className="px-4 py-3">{p.customerName}</td>
                <td className="px-4 py-3">{p.method}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.payerPhone ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.reference ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{money(p.amount, p.currency)}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === "FAILED" ? "destructive" : "outline"} title={p.failureReason ?? undefined}>
                    {p.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No matching payments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}