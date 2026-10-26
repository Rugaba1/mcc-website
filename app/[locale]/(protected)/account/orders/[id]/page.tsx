"use client";

import { MediaImage } from "@/components/media-image";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type InvoiceRef, type MyOrderDetail, type OrderRequest } from "@/lib/api";
import { useFormatters } from "@/contexts/format-context";
import { StatusBadge } from "@/components/account/status-badge";
import { InvoiceViewerDialog } from "@/components/invoices/invoice-viewer-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const KIND_LABEL: Record<InvoiceRef["kind"], string> = {
  PROFORMA: "Proforma invoice",
  INVOICE: "Invoice",
  CREDIT_NOTE: "Credit note",
};

export default function OrderDetailPage() {
  const { money, number, date, dateTime } = useFormatters();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<MyOrderDetail | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");
  const [invoice, setInvoice] = useState<InvoiceRef | null>(null);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [requestKind, setRequestKind] = useState<OrderRequest["kind"]>("CANCEL");
  const [requestReason, setRequestReason] = useState("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    api.getMyOrder(Number(id)).then((o) => {
      setOrder(o);
      setState("ok");
    }).catch(() => setState("missing"));
    api.getMyOrderRequests(Number(id)).then(setRequests).catch((error) => {
      toast.error(apiErrorMessage(error, "Could not load order requests"));
    });
  }, [id]);

  const canCancel = order !== null && ["PENDING", "PAID", "PROCESSING"].includes(order.status);
  const canRequestRefund = order !== null && ["PAID", "PARTIALLY_REFUNDED"].includes(order.paymentStatus);
  const requestOptions = [
    ...(canCancel ? [{ kind: "CANCEL" as const, label: "Cancel this order" }] : []),
    ...(canRequestRefund ? [{ kind: "REFUND" as const, label: "Request a refund" }] : []),
  ];
  const selectedRequestKind =
    requestOptions.find((option) => option.kind === requestKind)?.kind ??
    requestOptions[0]?.kind;

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequestKind) return;
    setRequesting(true);
    try {
      const created = await api.createMyOrderRequest(Number(id), {
        kind: selectedRequestKind,
        reason: requestReason.trim(),
      });
      setRequests((current) => [created, ...current]);
      setRequestReason("");
      toast.success("Your request was sent to our team");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not submit your request"));
    } finally {
      setRequesting(false);
    }
  };

  if (state === "loading") return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (state === "missing" || !order) {
    return <p className="text-sm">Order not found. <Link href="/account/orders" className="text-primary hover:underline">Back to orders</Link></p>;
  }

  const c = order.currency;
  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="text-sm text-muted-foreground hover:underline">← All orders</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-playfair text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed {dateTime(order.placedAt)}</p>
        </div>
        <div className="flex gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /></div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <section className="divide-y divide-border  border border-border bg-background">
          {order.items.map((i) => {
            const qty = Number(i.quantity);
            const unit = Number(i.unitPrice);
            return (
              <div key={i.id} className="flex gap-4 p-4 text-sm">
                {i.image && <MediaImage src={i.image} alt="" className="h-16 w-16 object-cover" />}
                <div className="flex-1">
                  <p className="font-semibold">{i.productName}</p>
                  <p className="text-xs text-muted-foreground">{[i.size, i.finish].filter(Boolean).join(" · ")} · {i.sku}</p>
                  <p className="text-xs text-muted-foreground">
                    {number(qty, { maximumFractionDigits: 2 })} m² × {money(unit, c)}/m²
                  </p>
                </div>
                <p className="font-medium">{money(i.lineTotal, c)}</p>
              </div>
            );
          })}
        </section>

        <aside className="space-y-4">
          <dl className="space-y-2  border border-border bg-background p-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(order.subtotal, c)}</dd></div>
            {order.discountTotal > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>−{money(order.discountTotal, c)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{order.shippingFee ? money(order.shippingFee, c) : "Free"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">VAT</dt><dd>{money(order.taxTotal, c)}</dd></div>
            <div className="flex justify-between border-t border-border pt-2 font-bold"><dt>Total</dt><dd>{money(order.grandTotal, c)}</dd></div>
          </dl>

          {order.invoices?.length > 0 && (
            <div className=" border border-border bg-background p-5 text-sm">
              <p className="mb-3 font-semibold">Documents</p>
              <div className="space-y-2">
                {order.invoices.map((inv) => (
                  <Button
                    key={inv.id}
                    variant="outline"
                    className="h-auto w-full justify-start gap-3 px-3 py-2 text-left"
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
                ))}
              </div>
            </div>
          )}

          <div className=" border border-border bg-background p-5 text-sm">
            <p className="mb-1 font-semibold">{order.fulfillment === "PICKUP" ? "Pick up" : "Deliver to"}</p>
            <p>{order.shipFullName}</p>
            <p className="text-muted-foreground">{order.shipPhone}</p>
            {order.tin && <p className="text-muted-foreground">Rwanda TIN: {order.tin}</p>}
            {order.fulfillment === "DELIVERY" && (
              <p className="text-muted-foreground">{[order.shipStreet, order.shipSector, order.shipDistrict].filter(Boolean).join(", ")}</p>
            )}
          </div>

          <div className=" border border-border bg-background p-5 text-sm">
            <p className="mb-2 font-semibold">Progress</p>
            <ol className="space-y-2">
              {order.history.map((h) => (
                <li key={h.id} className="flex items-start gap-3">
                  <StatusBadge status={h.status} />
                  <span className="text-xs text-muted-foreground">{dateTime(h.createdAt)}{h.note ? ` · ${h.note}` : ""}</span>
                </li>
              ))}
            </ol>
          </div>

          <section className="space-y-4 border border-border bg-background p-5 text-sm" aria-labelledby="order-requests-title">
            <div>
              <h2 id="order-requests-title" className="font-semibold">Order help</h2>
              <p className="mt-1 text-muted-foreground">Send a cancellation or refund request to our team. We’ll review it and reply by email.</p>
            </div>
            {requests.length > 0 && (
              <ul className="space-y-3">
                {requests.map((request) => (
                  <li key={request.id} className="space-y-1 border-t border-border pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{request.kind === "CANCEL" ? "Cancellation request" : "Refund request"}</span>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="whitespace-pre-wrap text-muted-foreground">{request.message}</p>
                    <p className="text-xs text-muted-foreground">Submitted {dateTime(request.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            {requestOptions.length > 0 ? (
              <form className="space-y-3 border-t border-border pt-4" onSubmit={submitRequest}>
                <div className="space-y-2">
                  <Label htmlFor="order-request-kind">Request type</Label>
                  <Select
                    value={selectedRequestKind}
                    onValueChange={(value) => setRequestKind(value as OrderRequest["kind"])}
                  >
                    <SelectTrigger id="order-request-kind" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {requestOptions.map((option) => (
                        <SelectItem key={option.kind} value={option.kind}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-request-reason">Reason</Label>
                  <Textarea
                    id="order-request-reason"
                    name="reason"
                    minLength={10}
                    maxLength={3000}
                    required
                    value={requestReason}
                    onChange={(event) => setRequestReason(event.target.value)}
                    placeholder="Tell us how we can help (at least 10 characters)"
                  />
                </div>
                <Button type="submit" disabled={requesting || requestReason.trim().length < 10}>
                  {requesting ? "Sending…" : "Send request"}
                </Button>
              </form>
            ) : (
              <p className="border-t border-border pt-3 text-muted-foreground">
                This order is no longer eligible for an online cancellation or refund request. Contact our team if you need help.
              </p>
            )}
          </section>
        </aside>
      </div>

      <InvoiceViewerDialog invoice={invoice} onClose={() => setInvoice(null)} />
    </div>
  );
}