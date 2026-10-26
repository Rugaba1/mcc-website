"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type   ReactNode,
} from "react";
import Image from "next/image";
import { FileText, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const extension = file?.url.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase();
  const isDocx =
    file?.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx";
  const isPdf = file?.mimeType === "application/pdf" || extension === "pdf";
  const isImage = Boolean(file?.mimeType?.startsWith("image/")) ||
    Boolean(extension && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(extension));

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

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,80rem)] flex-col rounded-none">
        <DialogHeader>
          <DialogTitle className="truncate">{file?.name ?? "Media preview"}</DialogTitle>
          <DialogDescription className="sr-only">
            Preview of the selected image or document.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto border bg-muted/20">
          {file && isImage ? (
            <div className="relative mx-auto h-[75vh] w-full">
              <Image
                src={file.url}
                alt={file.name}
                fill
                sizes="96vw"
                className="object-contain"
              />
            </div>
          ) : file && isPdf ? (
            <iframe
              title={file.name}
              src={file.url}
              className="h-[75vh] w-full"
            />
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
