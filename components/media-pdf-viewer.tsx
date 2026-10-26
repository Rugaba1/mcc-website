"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Download, Loader2, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, apiErrorMessage } from "@/lib/api";

const InvoicePdfPages = dynamic(
  () => import("@/components/invoices/invoice-pdf-pages"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    ),
  },
);

const MIN_SCALE = 0.6;
const MAX_SCALE = 2;
const SCALE_STEP = 0.2;

export function MediaPdfViewer({
  url,
  name,
  toolbar = true,
}: {
  url: string;
  name: string;
  toolbar?: boolean;
}) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setBlob(null);
    setError(null);
    setScale(1);

    api
      .getMediaPdf(url)
      .then((result) => {
        if (!cancelled) setBlob(result);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(apiErrorMessage(loadError, "Could not load PDF preview"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  function download() {
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }

  return (
    <section className="flex min-h-0 flex-col" aria-label={`PDF preview: ${name}`}>
      {toolbar && (
        <div className="flex flex-wrap items-center justify-end gap-1 border-b px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            disabled={!blob || scale <= MIN_SCALE}
            onClick={() =>
              setScale((current) => Math.max(MIN_SCALE, +(current - SCALE_STEP).toFixed(1)))
            }
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            disabled={!blob || scale >= MAX_SCALE}
            onClick={() =>
              setScale((current) => Math.min(MAX_SCALE, +(current + SCALE_STEP).toFixed(1)))
            }
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button type="button" size="sm" className="ml-1" disabled={!blob} onClick={download}>
            <Download className="size-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto bg-muted p-3 sm:p-4">
        {error ? (
          <p role="alert" className="py-24 text-center text-sm text-destructive">
            {error}
          </p>
        ) : blob ? (
          <InvoicePdfPages file={blob} scale={scale} />
        ) : (
          <div className="flex justify-center py-24 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
      </div>
    </section>
  );
}
