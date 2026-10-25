"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type OrderSummary, type PaymentSummary } from "@/lib/api";
import { ResourcePage, type Values } from "@/components/admin/resource-page";
import { ImageField } from "@/components/file-picker";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { options, pretty } from "@/lib/format";
import { useFormatters } from "@/contexts/format-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DataPagination } from "@/components/admin/data-pagination";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";

const STATUSES = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];
const METHODS = ["MTN_MOMO", "AIRTEL_MONEY", "CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY"];

// ─── Detail panel: verify, edit, refund ───────────────────────────────────────

function PaymentView({ row, reload }: { row: PaymentSummary; reload: () => Promise<void> }) {
  const { money, dateTime } = useFormatters();
  const locked = row.refundedAmount > 0;
  const [status, setStatus] = useState(row.status);
  const [ref, setRef] = useState(row.reference ?? "");
  const [phone, setPhone] = useState(row.payerPhone ?? "");
  const [note, setNote] = useState(row.note ?? "");
  const [proof, setProof] = useState(row.proofUrl ?? "");
  const [reason, setReason] = useState(row.failureReason ?? "");
  const [busy, setBusy] = useState(false);

  const refundable = Math.round((row.amount - row.refundedAmount) * 100) / 100;
  const canRefund = (row.status === "PAID" || row.status === "PARTIALLY_REFUNDED") && refundable > 0;
  const [refundAmt, setRefundAmt] = useState(String(refundable));
  const [refundWhy, setRefundWhy] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setStatus(row.status); setRef(row.reference ?? ""); setPhone(row.payerPhone ?? ""); setNote(row.note ?? "");
    setProof(row.proofUrl ?? ""); setReason(row.failureReason ?? ""); setRefundAmt(String(refundable)); setRefundWhy(""); setConfirming(false);
  }, [row, refundable]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); await reload(); }
    catch (e) { toast.error(apiErrorMessage(e, "Something went wrong")); }
    finally { setBusy(false); }
  };

  const save = (override: Partial<{ status: string }> = {}) => {
    const next = override.status ?? status;
    return run(
      () => api.updatePayment(row.id, {
        ...(locked ? {} : { status: next }),
        providerRef: ref, payerPhone: phone, note, proofUrl: proof,
        failureReason: next === "FAILED" ? reason : null,
      }),
      "Payment updated",
    );
  };

  const amount = Number(refundAmt);
  const refundInvalid = !(amount > 0) || amount > refundable + 0.005 || refundWhy.trim().length < 3;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border p-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{money(row.amount, row.currency)}</p>
          <p className="text-sm text-muted-foreground">{pretty(row.method)}{row.provider ? ` · ${row.provider}` : ""} · {dateTime(row.paidAt ?? row.createdAt)}</p>
        </div>
        <StatusBadge status={row.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>Order <Link href={`/admin/orders/${row.orderId}`} className="font-medium underline">{row.orderNumber}</Link> · {row.customerName}</span>
        <span className="text-muted-foreground">Order total {money(row.orderTotal, row.currency)}</span>
      </div>

      {row.refundedAmount > 0 && (
        <p className="border-l-2 border-warning bg-warning/10 p-3 text-sm">
          Refunded {money(row.refundedAmount, row.currency)}{row.refundedAt ? ` on ${dateTime(row.refundedAt)}` : ""}.{row.refundReason ? ` Reason: ${row.refundReason}` : ""}
        </p>
      )}

      {/* Verify */}
      {(row.status === "PENDING" || row.status === "AUTHORIZED") && (
        <section className="space-y-3 border p-4">
          <h3 className="text-sm font-semibold">Waiting for confirmation</h3>
          <p className="text-sm text-muted-foreground">Check the MoMo message or bank statement against the reference below, then confirm.</p>
          <div className="flex flex-wrap gap-2">
              <PermissionGate required={PERM.PAYMENTS_RECORD}>
                <Button className="rounded-none" disabled={busy} onClick={() => save({ status: "PAID" })}>{busy ? <Loader2 className="animate-spin" /> : <Check />} Mark as paid</Button>
                <Button variant="outline" className="rounded-none" disabled={busy} onClick={() => setStatus("FAILED")}>Mark as failed…</Button>
              </PermissionGate>
          </div>
        </section>
      )}

      {/* Edit */}
      <section className="space-y-4 border p-4">
        <h3 className="text-sm font-semibold">Details</h3>
        {!locked && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-none">
                {["PENDING", "AUTHORIZED", "PAID", "FAILED"].map((s) => <SelectItem key={s} value={s} className="rounded-none">{pretty(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {status === "FAILED" && !locked && <div className="space-y-1.5"><Label>Why did it fail?</Label><Input className="rounded-none" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reference not found on statement" /></div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Transaction reference</Label><Input className="rounded-none" value={ref} onChange={(e) => setRef(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Payer phone</Label><Input className="rounded-none" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Note</Label><Textarea className="min-h-20 rounded-none" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Proof of payment</Label><ImageField value={proof} onChange={setProof} /></div>
        {locked && <p className="text-xs text-muted-foreground">This payment has refunds, so its status is locked. You can still edit the details above.</p>}
        <PermissionGate required={PERM.PAYMENTS_RECORD}>
          <Button className="rounded-none" disabled={busy} onClick={() => save()}>{busy && <Loader2 className="animate-spin" />}Save changes</Button>
        </PermissionGate>
      </section>

      {/* Refund */}
      {canRefund && (
        <PermissionGate required={PERM.PAYMENTS_REFUND}>
        <section className="space-y-3 border border-destructive/40 p-4">
          <h3 className="text-sm font-semibold">Refund</h3>
          <p className="text-sm text-muted-foreground">Send the money back to the customer first (MoMo, bank…), then record it here. You can refund up to {money(refundable, row.currency)}.</p>
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1.5"><Label>Amount</Label><Input className="rounded-none" type="number" min={0} value={refundAmt} onChange={(e) => { setRefundAmt(e.target.value); setConfirming(false); }} /></div>
            <div className="space-y-1.5"><Label>Reason</Label><Input className="rounded-none" value={refundWhy} onChange={(e) => { setRefundWhy(e.target.value); setConfirming(false); }} placeholder="Item returned, order cancelled…" /></div>
          </div>
          {!confirming ? (
            <Button variant="outline" className="rounded-none" disabled={refundInvalid || busy} onClick={() => setConfirming(true)}><Undo2 /> Record refund</Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Record a refund of <strong>{money(amount, row.currency)}</strong>?</span>
              <Button className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={busy} onClick={() => run(() => api.refundPayment(row.id, { amount, reason: refundWhy.trim() }), "Refund recorded")}>{busy && <Loader2 className="animate-spin" />}Yes, record it</Button>
              <Button variant="ghost" className="rounded-none" onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
          )}
        </section>
        </PermissionGate>
      )}
    </div>
  );
}

// ─── Order picker for "Add payment" ───────────────────────────────────────────

function OrderPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { money } = useFormatters();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const query = useDebouncedValue(q, 250);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.getUnpaidOrdersPage(page, 15, query.trim())
      .then((result) => {
        setOrders(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        if (result.page !== page) setPage(result.page);
      })
      .catch((e) => toast.error(apiErrorMessage(e, "Failed to load orders")))
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => setPage(1), [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="rounded-none pl-8" placeholder="Search order number or customer" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="max-h-48 overflow-y-auto border">
        {loading ? <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</p>
          : orders.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No unpaid orders found.</p>
            : orders.map((o) => (
              <button key={o.id} type="button" onClick={() => onChange(String(o.id))}
                className={`flex w-full items-center justify-between gap-3 border-b p-2.5 text-left text-sm last:border-b-0 hover:bg-accent ${value === String(o.id) ? "bg-accent" : ""}`}>
                <span className="min-w-0"><span className="block font-medium">{o.orderNumber}</span><span className="block truncate text-xs text-muted-foreground">{o.customerName}</span></span>
                <span className="shrink-0 tabular-nums">{money(o.grandTotal)}</span>
              </button>
            ))}
      </div>
      {total > 0 && <DataPagination page={page} totalPages={totalPages} total={total} pageSize={15} onPageChange={setPage} disabled={loading} />}
      <p className="text-xs text-muted-foreground">Only orders that still owe money are listed.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const { money, dateTime } = useFormatters();
  return (
    <ResourcePage<PaymentSummary>
      title="Payments"
      description="Confirm manual payments, fix details and record refunds."
      entityName="payment"
      loadPage={api.getPaymentsPage}
      createPermission={PERM.PAYMENTS_RECORD}
      filters={[
        { key: "status", label: "Statuses", options: options(STATUSES) },
        { key: "method", label: "Methods", options: options(METHODS) },
      ]}
      columns={[
        { header: "Order", cell: (p) => <span className="font-medium">{p.orderNumber}</span> },
        { header: "Customer", cell: (p) => <div><p>{p.customerName}</p>{p.payerPhone && <p className="text-xs text-muted-foreground">{p.payerPhone}</p>}</div> },
        { header: "Method", cell: (p) => <div><p>{pretty(p.method)}</p>{p.provider && <p className="text-xs text-muted-foreground">{p.provider}</p>}</div> },
        { header: "Reference", cell: (p) => <span className="font-mono text-xs text-muted-foreground">{p.reference ?? "—"}</span> },
        { header: "Status", cell: (p) => <div className="space-y-1"><StatusBadge status={p.status} />{p.failureReason && <p className="max-w-48 text-xs text-destructive">{p.failureReason}</p>}</div> },
        { header: "Amount", className: "text-right", cell: (p) => <div className="text-right"><p className="font-medium tabular-nums">{money(p.amount, p.currency)}</p>{p.refundedAmount > 0 && <p className="text-xs text-warning dark:text-warning">−{money(p.refundedAmount, p.currency)} refunded</p>}</div> },
        { header: "Date", cell: (p) => dateTime(p.paidAt ?? p.createdAt) },
      ]}
      detail={{
        title: (p) => `Payment for ${p.orderNumber}`,
        description: (p) => `${p.customerName} · ${pretty(p.method)}`,
        render: (p, { reload }) => <PaymentView row={p} reload={reload} />,
      }}
      fields={[
        { name: "orderId", label: "Order", type: "custom", required: true, render: (v, set) => <OrderPicker value={v ?? ""} onChange={set} /> },
        { name: "method", label: "Method", type: "select", required: true, options: options(METHODS) },
        { name: "status", label: "Payment is", type: "select", required: true, options: [{ value: "PAID", label: "Received" }, { value: "PENDING", label: "Waiting for confirmation" }] },
        { name: "amount", label: "Amount (base currency)", type: "number", required: true },
        { name: "providerRef", label: "Transaction reference", type: "text", hint: "MoMo transaction ID, bank slip number…" },
        { name: "payerPhone", label: "Payer phone", type: "text" },
        { name: "note", label: "Note", type: "text", wide: true, placeholder: "Paid in cash at the showroom" },
        { name: "proofUrl", label: "Proof of payment", type: "image" },
      ]}
      emptyForm={{ orderId: "", method: "CASH_ON_DELIVERY", status: "PAID", amount: "", providerRef: "", payerPhone: "", note: "", proofUrl: "" }}
      validate={(v: Values): Record<string, string> => (v.amount !== "" && !(Number(v.amount) > 0) ? { amount: "Enter an amount above 0" } : {})}
      create={(v) =>
        api.recordPayment(Number(v.orderId), {
          method: v.method, status: v.status, amount: Number(v.amount),
          providerRef: v.providerRef, payerPhone: v.payerPhone, note: v.note, proofUrl: v.proofUrl,
        })
      }
    />
  );
}