"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Download, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, apiErrorMessage, type InvoiceRef } from "@/lib/api"; // <- adjust path if needed

// pdf.js touches browser-only APIs at import time, so it must never render on the server.
const InvoicePdfPages = dynamic(() => import("./invoice-pdf-pages"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-24 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
    </div>
  ),
});

const KIND_LABEL: Record<InvoiceRef["kind"], string> = {
  PROFORMA: "Proforma invoice",
  INVOICE: "Invoice",
  CREDIT_NOTE: "Credit note",
};

const MIN_SCALE = 0.6;
const MAX_SCALE = 2;
const STEP = 0.2;

interface Props {
  /** Set to an invoice to open the dialog, null to close it. */
  invoice: Pick<InvoiceRef, "url" | "number" | "kind"> | null;
  onClose: () => void;
}

export function InvoiceViewerDialog({ invoice, onClose }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!invoice) return;
    let cancelled = false;
    setBlob(null);
    setError(null);
    setScale(1);

    api
      .getInvoicePdf(invoice.url)
      .then((b) => !cancelled && setBlob(b))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Could not load invoice")));

    return () => {
      cancelled = true;
    };
  }, [invoice?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  function download() {
    if (!blob || !invoice) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${invoice.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-3 pr-12">
          <div className="min-w-0 text-left">
            <DialogTitle className="truncate font-serif text-base">
              {invoice ? `${KIND_LABEL[invoice.kind]} ${invoice.number}` : "Invoice"}
            </DialogTitle>
            <DialogDescription className="sr-only">Invoice preview</DialogDescription>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom out"
              disabled={!blob || scale <= MIN_SCALE}
              onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - STEP).toFixed(1)))}
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="w-10 text-center text-xs text-muted-foreground tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom in"
              disabled={!blob || scale >= MAX_SCALE}
              onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + STEP).toFixed(1)))}
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button size="sm" className="ml-2" disabled={!blob} onClick={download}>
              <Download className="size-4" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-muted p-4">
          {error ? (
            <p className="py-24 text-center text-sm text-destructive">{error}</p>
          ) : blob ? (
            <InvoicePdfPages file={blob} scale={scale} />
          ) : (
            <div className="flex justify-center py-24 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
