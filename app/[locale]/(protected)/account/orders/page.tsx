"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type InvoiceRef, type MyOrderSummary } from "@/lib/api";
import { useFormatters } from "@/contexts/format-context";
import { StatusBadge } from "@/components/account/status-badge";
import { InvoiceViewerDialog } from "@/components/invoices/invoice-viewer-dialog";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/admin/data-pagination";

const PAGE_SIZE = 10;

const KIND_LABEL: Record<InvoiceRef["kind"], string> = {
  PROFORMA: "Proforma",
  INVOICE: "Invoice",
  CREDIT_NOTE: "Credit note",
};

export default function OrdersPage() {
  const { money, date } = useFormatters();
  const [data, setData] = useState<MyOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [invoice, setInvoice] = useState<InvoiceRef | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getMyOrdersPage(page, PAGE_SIZE);
      setData(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (e) {
      const message = apiErrorMessage(e, "Failed to load your orders");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-5">
      <h1 className="font-playfair text-3xl font-bold">My orders</h1>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && data.length === 0 && (
        <div className=" border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          You haven&apos;t placed an order yet.
          <div className="mt-3"><Button asChild><Link href="/products">Browse tiles</Link></Button></div>
        </div>
      )}
      {data.length > 0 && (
        <div className="overflow-x-auto  border border-border bg-background">
          <table className="w-full min-w-180 text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left">
                {["Order", "Placed", "Items", "Total", "Status", "Payment", "Invoice"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold"><Link href={`/account/orders/${o.id}`} className="text-primary hover:underline">{o.orderNumber}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{date(o.placedAt)}</td>
                  <td className="px-4 py-3">{o.itemCount}</td>
                  <td className="px-4 py-3 font-medium">{money(o.grandTotal, o.currency)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                  <td className="px-4 py-3">
                    {o.invoices?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {o.invoices.map((inv) => (
                          <Button
                            key={inv.id}
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 px-2 text-xs"
                            onClick={() => setInvoice(inv)}
                          >
                            <FileText className="size-3.5" />
                            {KIND_LABEL[inv.kind]}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 0 && (
        <DataPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          disabled={loading}
        />
      )}

      <InvoiceViewerDialog invoice={invoice} onClose={() => setInvoice(null)} />
    </div>
  );
}