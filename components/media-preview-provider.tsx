"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type   ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Download, FileText, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export interface MediaPreviewFile {
  url: string;
  name: string;
  mimeType?: string | null;
}

type MediaPreviewContextValue = {
  openPreview: (file: MediaPreviewFile) => void;
};

const MediaPreviewContext = createContext<MediaPreviewContextValue | null>(null);

export function useMediaPreview() {
  const context = useContext(MediaPreviewContext);
  if (!context) {
    throw new Error("useMediaPreview must be used inside MediaPreviewProvider");
  }
  return context;
}

export function MediaPreviewProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<MediaPreviewFile | null>(null);
  const value = useMemo(
    () => ({ openPreview: setFile }),
    [],
  );

  return (
    <MediaPreviewContext.Provider value={value}>
      {children}
      <MediaPreviewDialog file={file} onClose={() => setFile(null)} />
    </MediaPreviewContext.Provider>
  );
}

function MediaPreviewDialog({
  file,
  onClose,
}: {
  file: MediaPreviewFile | null;
  onClose: () => void;
}) {
  const [docxHtml, setDocxHtml] = useState("");
  const [docxError, setDocxError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfScale, setPdfScale] = useState(1);
  const extension = file?.url.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase();
  const isDocx =
    file?.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx";
  const isPdf = file?.mimeType === "application/pdf" || extension === "pdf";
  const isImage = Boolean(file?.mimeType?.startsWith("image/")) ||
    Boolean(extension && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(extension));

  useEffect(() => {
    if (!file || !isPdf) {
      setPdfBlob(null);
      setPdfError(null);
      setPdfScale(1);
      return;
    }

    let cancelled = false;
    setPdfBlob(null);
    setPdfError(null);
    setPdfScale(1);
    api
      .getMediaPdf(file.url)
      .then((blob) => {
        if (!cancelled) setPdfBlob(blob);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPdfError(apiErrorMessage(error, "Could not load PDF preview"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file?.url, isPdf]);

  useEffect(() => {
    if (!file || !isDocx) {
      setDocxHtml("");
      setDocxError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setDocxError("");
    fetch(file.url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load this document.");
        return response.arrayBuffer();
      })
      .then(async (arrayBuffer) => {
        const [{ default: mammoth }, { default: DOMPurify }] = await Promise.all([
          import("mammoth"),
          import("dompurify"),
        ]);
        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        if (!controller.signal.aborted) {
          setDocxHtml(DOMPurify.sanitize(value));
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("DOCX preview failed:", error);
          setDocxError("This document could not be previewed. Download it to open it.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [file, isDocx]);

  function downloadPdf() {
    if (!pdfBlob || !file) return;
    const href = URL.createObjectURL(pdfBlob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = file.name.toLowerCase().endsWith(".pdf")
      ? file.name
      : `${file.name}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[92dvh] w-[96vw] max-w-7xl flex-col gap-0 overflow-hidden rounded-none p-0">
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b px-4 py-3 pr-12 sm:px-5">
          <div className="min-w-0 text-left">
            <DialogTitle className="truncate font-serif text-base">
              {file?.name ?? "Media preview"}
            </DialogTitle>
          <DialogDescription className="sr-only">
            Preview of the selected image or document.
          </DialogDescription>
          </div>
          {file && isPdf && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Zoom out"
                disabled={!pdfBlob || pdfScale <= MIN_SCALE}
                onClick={() =>
                  setPdfScale((scale) => Math.max(MIN_SCALE, +(scale - SCALE_STEP).toFixed(1)))
                }
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
                {Math.round(pdfScale * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Zoom in"
                disabled={!pdfBlob || pdfScale >= MAX_SCALE}
                onClick={() =>
                  setPdfScale((scale) => Math.min(MAX_SCALE, +(scale + SCALE_STEP).toFixed(1)))
                }
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                className="ml-1"
                disabled={!pdfBlob}
                onClick={downloadPdf}
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          )}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto border bg-muted/20">
          {file && isImage ? (
            <div className="relative mx-auto h-full min-h-[60vh] w-full">
              <Image
                src={file.url}
                alt={file.name}
                fill
                sizes="96vw"
                className="object-contain"
              />
            </div>
          ) : file && isPdf ? (
            <div className="min-h-full bg-muted p-2 sm:p-4">
              {pdfError ? (
                <p role="alert" className="py-24 text-center text-sm text-destructive">
                  {pdfError}
                </p>
              ) : pdfBlob ? (
                <InvoicePdfPages file={pdfBlob} scale={pdfScale} />
              ) : (
                <div className="flex justify-center py-24 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              )}
            </div>
          ) : file && isDocx ? (
            <div className="mx-auto min-h-[50vh] max-w-4xl bg-background p-6 sm:p-10">
              {loading ? (
                <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading document preview…
                </p>
              ) : docxError ? (
                <p role="alert" className="py-16 text-center text-sm text-destructive">
                  {docxError}
                </p>
              ) : (
                <article
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                />
              )}
            </div>
          ) : file ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <FileText className="size-10" />
              <p className="text-sm">Preview isn’t available for this file type.</p>
              <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                Download or open file
              </a>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
