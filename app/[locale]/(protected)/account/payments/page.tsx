"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Clock, Loader2, Pencil, RefreshCw, RotateCcw, Trash2, Wallet, CreditCard, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type ManualMethod, type MyPayment, type MyPaymentOrder, type MyPaymentsOverview } from "@/lib/api";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { DataPagination } from "@/components/admin/data-pagination";
import { StatusBadge } from "@/components/status-badge";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, money, pretty } from "@/lib/format";

// TODO: replace these placeholders with your real payment details
const PAY_INFO: Record<ManualMethod, { label: string; steps: string }> = {
    MTN_MOMO: { label: "MTN Mobile Money", steps: "Dial *182*8*1# and pay to merchant code 000000 (Mountain Ceramic). Then enter the transaction ID from the SMS below." },
    AIRTEL_MONEY: { label: "Airtel Money", steps: "Dial *500# and pay to merchant code 000000 (Mountain Ceramic). Then enter the transaction ID from the SMS below." },
    BANK_TRANSFER: { label: "Bank transfer", steps: "Transfer to account 000-0000000-00 (Mountain Ceramic Ltd, Bank of Kigali) and use your order number as the reference. Enter the slip or transaction number below." },
    CASH_ON_DELIVERY: { label: "Pay on delivery", steps: "Pay in cash when your order arrives. We’ll confirm the payment on delivery." },
};
const PAGE_SIZE = 8;

export default function CustomerPaymentsPage() {
    const [data, setData] = useState<MyPaymentsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState("due");
    const [page, setPage] = useState(1);

    const [paying, setPaying] = useState<MyPaymentOrder | null>(null);
    const [editing, setEditing] = useState<{ payment: MyPayment; order: MyPaymentOrder } | null>(null);
    const [withdrawing, setWithdrawing] = useState<MyPayment | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try { setData(await api.getMyPayments()); }
        catch (e) { const m = apiErrorMessage(e, "Failed to load your payments"); setError(m); toast.error(m); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const due = useMemo(() => (data?.orders ?? []).filter((o) => o.balanceDue > 0 || o.payments.some((p) => p.status === "PENDING")), [data]);
    const history = useMemo(
        () => (data?.orders ?? []).flatMap((o) => o.payments.map((p) => ({ ...p, order: o }))).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
        [data],
    );
    const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
    const pageRows = history.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE);

    const withdraw = async () => {
        if (!withdrawing) return;
        setBusy(true);
        try { await api.withdrawMyPayment(withdrawing.id); toast.success("Payment withdrawn"); setWithdrawing(null); await load(); }
        catch (e) { toast.error(apiErrorMessage(e, "Could not withdraw the payment")); }
        finally { setBusy(false); }
    };

    const s = data?.summary;

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My payments</h1>
                    <p className="text-sm text-muted-foreground">Pay for your orders, track confirmations and see refunds.</p>
                </div>
                <Button variant="outline" size="icon" className="rounded-none" onClick={load} disabled={loading} aria-label="Refresh"><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
            </header>

            {error && !data ? (
                <Card className="rounded-none"><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><p>{error}</p><Button className="rounded-none" onClick={load}>Try again</Button></CardContent></Card>
            ) : !data || !s ? (
                <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-none" />)}</div><Skeleton className="h-64 rounded-none" /></div>
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Kpi icon={Wallet} label="Still to pay" value={money(s.outstanding)} tone={s.outstanding > 0 ? "amber" : undefined} />
                        <Kpi icon={CreditCard} label="Paid so far" value={money(s.totalPaid)} />
                        <Kpi icon={Clock} label="Waiting for confirmation" value={money(s.pendingAmount)} hint={`${s.pendingCount} payment${s.pendingCount === 1 ? "" : "s"}`} />
                        <Kpi icon={RotateCcw} label="Refunded" value={money(s.refunded)} />
                    </section>

                    <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="rounded-none">
                            <TabsTrigger value="due" className="rounded-none">To pay ({due.length})</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-none">History ({history.length})</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {tab === "due" ? (
                        due.length === 0 ? (
                            <Card className="rounded-none"><CardContent className="py-14 text-center text-sm text-muted-foreground">You’re all paid up. Nothing is waiting on you.</CardContent></Card>
                        ) : (
                            <div className="space-y-4">
                                {due.map((o) => (
                                    <Card key={o.id} className="rounded-none py-0">
                                        <CardContent className="space-y-4 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <Link href={`/account/orders/${o.id}`} className="font-semibold hover:underline">{o.orderNumber}</Link>
                                                    <p className="text-xs text-muted-foreground">Placed {fmtDate(o.placedAt)}</p>
                                                </div>
                                                <div className="flex gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.paymentStatus} /></div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="h-2 w-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (o.paid / o.grandTotal) * 100)}%` }} /></div>
                                                <div className="flex flex-wrap justify-between gap-2 text-sm">
                                                    <span className="text-muted-foreground">Paid {money(o.paid, o.currency)} of {money(o.grandTotal, o.currency)}</span>
                                                    <span className="font-semibold">Balance {money(o.balanceDue, o.currency)}</span>
                                                </div>
                                            </div>

                                            {o.payments.filter((p) => p.status === "PENDING").map((p) => (
                                                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border bg-muted/40 p-3 text-sm">
                                                    <div>
                                                        <p className="font-medium">{money(p.amount, o.currency)} via {pretty(p.method)} <StatusBadge status="PENDING" /></p>
                                                        <p className="text-xs text-muted-foreground">{p.method === "CASH_ON_DELIVERY" ? "We’ll confirm when your order is delivered." : `Reference ${p.providerRef ?? "—"} · we’re checking it and will confirm shortly.`}</p>
                                                    </div>
                                                    {p.manual && (
                                                        <div className="flex gap-1">
                                                            {p.method !== "CASH_ON_DELIVERY" && <Button size="sm" variant="outline" className="rounded-none" onClick={() => setEditing({ payment: p, order: o })}><Pencil /> Fix details</Button>}
                                                            <Button size="sm" variant="ghost" className="rounded-none text-destructive hover:text-destructive" onClick={() => setWithdrawing(p)}><Trash2 /> Withdraw</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {o.canPay && <Button className="rounded-none" onClick={() => setPaying(o)}>Pay {money(o.balanceDue, o.currency)}</Button>}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="border bg-card">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Order</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {pageRows.length === 0 ? <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No payments yet.</TableCell></TableRow> : pageRows.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="whitespace-nowrap">{fmtDate(p.paidAt ?? p.createdAt)}</TableCell>
                                                <TableCell className="font-medium">{p.order.orderNumber}</TableCell>
                                                <TableCell>{pretty(p.method)}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{p.providerRef ?? "—"}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={p.status} />
                                                    {p.failureReason && <p className="mt-1 max-w-48 text-xs text-destructive">{p.failureReason}</p>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <p className="font-medium tabular-nums">{money(p.amount, p.order.currency)}</p>
                                                    {p.refundedAmount > 0 && <p className="text-xs text-amber-600 dark:text-amber-400">−{money(p.refundedAmount, p.order.currency)} refunded{p.refundedAt ? ` on ${fmtDate(p.refundedAt)}` : ""}</p>}
                                                    {p.refundReason && <p className="text-xs text-muted-foreground">{p.refundReason}</p>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <DataPagination page={Math.min(page, totalPages)} totalPages={totalPages} total={history.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
                        </div>
                    )}
                </>
            )}

            <PayDialog order={paying} onClose={() => setPaying(null)} onDone={load} />
            <FixDialog target={editing} onClose={() => setEditing(null)} onDone={load} />
            <ConfirmDelete open={!!withdrawing} onOpenChange={(o) => { if (!o) setWithdrawing(null); }} title="Withdraw this payment?"
                description="Use this if you entered it by mistake. If you already sent the money, contact us instead so we can match it to your order." busy={busy} onConfirm={withdraw} />
        </main>
    );
}

function Kpi({ icon: Icon, label, value, hint, tone }: { icon: LucideIcon; label: string; value: string; hint?: string; tone?: "amber" }) {
    return (
        <Card className="rounded-none py-0">
            <CardContent className="flex items-center gap-3 p-4">
                <span className={`flex size-10 shrink-0 items-center justify-center border ${tone === "amber" ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}><Icon className="size-5" /></span>
                <div className="min-w-0"><p className="truncate text-lg font-semibold tabular-nums">{value}</p><p className="truncate text-xs text-muted-foreground">{label}{hint ? ` · ${hint}` : ""}</p></div>
            </CardContent>
        </Card>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return <div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}

function PayDialog({ order, onClose, onDone }: { order: MyPaymentOrder | null; onClose: () => void; onDone: () => void }) {
    const [method, setMethod] = useState<ManualMethod>("MTN_MOMO");
    const [amount, setAmount] = useState("");
    const [phone, setPhone] = useState("");
    const [ref, setRef] = useState("");
    const [note, setNote] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (order) { setMethod("MTN_MOMO"); setAmount(String(order.balanceDue)); setPhone(""); setRef(""); setNote(""); setErrors({}); }
    }, [order]);

    const mobile = method === "MTN_MOMO" || method === "AIRTEL_MONEY";
    const needsRef = method !== "CASH_ON_DELIVERY";

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!order) return;
        const next: Record<string, string> = {};
        const amt = Number(amount);
        if (!(amt > 0)) next.amount = "Enter an amount";
        else if (amt > order.balanceDue) next.amount = `The most you can pay is ${money(order.balanceDue, order.currency)}`;
        if (mobile && phone.replace(/\D/g, "").length < 9) next.phone = "Enter the phone number you paid from";
        if (needsRef && ref.trim().length < 4) next.ref = "Enter the transaction ID or reference";
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        try {
            await api.payMyOrder(order.id, { method, amount: amt, payerPhone: phone, providerRef: ref, note });
            toast.success(method === "CASH_ON_DELIVERY" ? "Got it. Pay on delivery." : "Thanks! We’ll confirm your payment shortly.");
            onClose();
            onDone();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not submit your payment"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={!!order} onOpenChange={(o) => !o && !saving && onClose()}>
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-none sm:max-w-lg">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Pay for {order?.orderNumber}</DialogTitle>
                        <DialogDescription>Balance {order ? money(order.balanceDue, order.currency) : ""}. Pay first, then tell us the details so we can confirm it.</DialogDescription>
                    </DialogHeader>

                    <Field label="How are you paying?">
                        <Select value={method} onValueChange={(v) => setMethod(v as ManualMethod)}>
                            <SelectTrigger className="w-full rounded-none"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-none">{(Object.keys(PAY_INFO) as ManualMethod[]).map((m) => <SelectItem key={m} value={m} className="rounded-none">{PAY_INFO[m].label}</SelectItem>)}</SelectContent>
                        </Select>
                    </Field>

                    <p className="border-l-2 border-primary bg-muted/50 p-3 text-sm">{PAY_INFO[method].steps}</p>

                    <Field label="Amount you are paying (RWF)" error={errors.amount}><Input className="rounded-none" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                    {mobile && <Field label="Phone you paid from" error={errors.phone}><Input className="rounded-none" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" inputMode="tel" /></Field>}
                    {needsRef && <Field label="Transaction ID or reference" error={errors.ref}><Input className="rounded-none" value={ref} onChange={(e) => setRef(e.target.value)} /></Field>}
                    <Field label="Note (optional)"><Textarea className="min-h-16 rounded-none" value={note} onChange={(e) => setNote(e.target.value)} /></Field>

                    <DialogFooter>
                        <Button type="button" variant="outline" className="rounded-none" onClick={onClose} disabled={saving}>Cancel</Button>
                        <Button type="submit" className="rounded-none" disabled={saving}>{saving && <Loader2 className="animate-spin" />}{method === "CASH_ON_DELIVERY" ? "Confirm" : "I’ve paid"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function FixDialog({ target, onClose, onDone }: { target: { payment: MyPayment; order: MyPaymentOrder } | null; onClose: () => void; onDone: () => void }) {
    const [ref, setRef] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => { setRef(target?.payment.providerRef ?? ""); setPhone(target?.payment.payerPhone ?? ""); }, [target]);

    const save = async () => {
        if (!target) return;
        if (ref.trim().length < 4) return toast.error("Enter the transaction ID or reference");
        setSaving(true);
        try { await api.updateMyPayment(target.payment.id, { providerRef: ref, payerPhone: phone }); toast.success("Details updated"); onClose(); onDone(); }
        catch (e) { toast.error(apiErrorMessage(e, "Could not update the payment")); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={!!target} onOpenChange={(o) => !o && !saving && onClose()}>
            <DialogContent className="rounded-none sm:max-w-md">
                <DialogHeader><DialogTitle>Fix payment details</DialogTitle><DialogDescription>Correct a typo in the reference so we can find your payment.</DialogDescription></DialogHeader>
                <div className="space-y-4">
                    <Field label="Transaction ID or reference"><Input className="rounded-none" value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
                    <Field label="Phone you paid from"><Input className="rounded-none" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></Field>
                </div>
                <DialogFooter>
                    <Button variant="outline" className="rounded-none" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button className="rounded-none" onClick={save} disabled={saving}>{saving && <Loader2 className="animate-spin" />}Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}