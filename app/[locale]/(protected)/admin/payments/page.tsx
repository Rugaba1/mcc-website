"use client";

import { api, type PaymentSummary } from "@/lib/api";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/status-badge";
import { fmtDateTime, money, options, pretty } from "@/lib/format";

const STATUSES = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];
const METHODS = ["MTN_MOMO", "AIRTEL_MONEY", "CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY"];

export default function AdminPaymentsPage() {
  return (
    <ResourcePage<PaymentSummary>
      title="Payments"
      description="Every payment attempt, from mobile money to card."
      entityName="payment"
      load={api.getPayments}
      searchText={(p) => `${p.orderNumber} ${p.customerName} ${p.reference ?? ""} ${p.payerPhone ?? ""} ${p.provider ?? ""}`}
      filters={[
        { key: "status", label: "Statuses", options: options(STATUSES), match: (p, v) => p.status === v },
        { key: "method", label: "Methods", options: options(METHODS), match: (p, v) => p.method === v },
      ]}
      columns={[
        { header: "Order", cell: (p) => <span className="font-medium">{p.orderNumber}</span> },
        { header: "Customer", cell: (p) => <div><p>{p.customerName}</p>{p.payerPhone && <p className="text-xs text-muted-foreground">{p.payerPhone}</p>}</div> },
        { header: "Method", cell: (p) => <div><p>{pretty(p.method)}</p>{p.provider && <p className="text-xs text-muted-foreground">{p.provider}</p>}</div> },
        { header: "Reference", cell: (p) => <span className="font-mono text-xs text-muted-foreground">{p.reference ?? "—"}</span> },
        { header: "Status", cell: (p) => <div className="space-y-1"><StatusBadge status={p.status} />{p.failureReason && <p className="max-w-48 text-xs text-destructive">{p.failureReason}</p>}</div> },
        { header: "Amount", className: "text-right", cell: (p) => <span className="font-medium tabular-nums">{money(p.amount, p.currency)}</span> },
        { header: "Date", cell: (p) => fmtDateTime(p.paidAt ?? p.createdAt) },
      ]}
    />
  );
}