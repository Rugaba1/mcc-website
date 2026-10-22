"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { api, type InvoiceRef, type MyOrderDetail } from "@/lib/api";
import { money } from "@/lib/format";
import { StatusBadge } from "@/components/account/status-badge";
import { InvoiceViewerDialog } from "@/components/invoices/invoice-viewer-dialog";
import { Button } from "@/components/ui/button";

const KIND_LABEL: Record<InvoiceRef["kind"], string> = {
  PROFORMA: "Proforma invoice",
  INVOICE: "Invoice",
  CREDIT_NOTE: "Credit note",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<MyOrderDetail | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");
  const [invoice, setInvoice] = useState<InvoiceRef | null>(null);

  useEffect(() => {
    api.getMyOrder(Number(id)).then((o) => { setOrder(o); setState("ok"); }).catch(() => setState("missing"));
  }, [id]);

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
          <p className="text-sm text-muted-foreground">Placed {new Date(order.placedAt).toLocaleString()}</p>
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
                {i.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.image} alt="" className="h-16 w-16 object-cover" />}
                <div className="flex-1">
                  <p className="font-semibold">{i.productName}</p>
                  <p className="text-xs text-muted-foreground">{[i.size, i.finish].filter(Boolean).join(" · ")} · {i.sku}</p>
                  <p className="text-xs text-muted-foreground">
                    {qty.toLocaleString("en-US", { maximumFractionDigits: 2 })} m² × {money(unit, c)}/m²
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
            {order.discountTotal > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd>−{money(order.discountTotal, c)}</dd></div>}
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
                        {inv.number} · {new Date(inv.issuedAt).toLocaleDateString()}
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
                  <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}{h.note ? ` · ${h.note}` : ""}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <InvoiceViewerDialog invoice={invoice} onClose={() => setInvoice(null)} />
    </div>
  );
}