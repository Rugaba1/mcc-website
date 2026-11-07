"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type   ReactNode,
} from "react";
import { MediaImage } from "@/components/media-image";
import { FileText, Loader2 } from "lucide-react";
import { MediaPdfViewer } from "@/components/media-pdf-viewer";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

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
  id?: number;
  isPublic?: boolean;
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
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privateImageUrl, setPrivateImageUrl] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const extension = file?.url.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase();
  const contentUrl =
    file?.isPublic === false && file.id
      ? `/api/files/${file.id}/content`
      : file?.url;
  const isDocx =
    file?.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx";
  const isPdf = file?.mimeType === "application/pdf" || extension === "pdf";
  const isImage = Boolean(file?.mimeType?.startsWith("image/")) ||
    Boolean(extension && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(extension));

  useEffect(() => {
    setPrivateImageUrl(null);
    setImageError("");
    if (!file || file.isPublic !== false || !file.id || !isImage) return;

    let objectUrl: string | null = null;
    let cancelled = false;
    api.getPrivateMedia(file.id).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setPrivateImageUrl(objectUrl);
    }).catch((error: unknown) => {
      if (!cancelled) {
        console.error("Private image preview failed:", error);
        setImageError("This private image could not be loaded.");
      }
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, isImage]);

  useEffect(() => {
    if (!file || !isDocx) {
      setDocxHtml("");
      setDocxError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setDocxError("");
    (file.isPublic === false && file.id
      ? api.getPrivateMedia(file.id)
      : api.getMediaPdf(file.url)
    )
      .then((blob) => blob.arrayBuffer())
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

  const downloadPrivateFile = async () => {
    if (!file?.id) return;
    setDownloadError("");
    try {
      const blob = await api.getPrivateMedia(file.id);
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
    } catch (error) {
      console.error("Private file download failed:", error);
      setDownloadError("This file could not be downloaded. Check your media access and try again.");
    }
  };

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[92dvh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-none p-0 sm:w-[80vw]"
        style={{ maxWidth: "min(1200px, calc(100vw - 2rem))" }}
      >
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b px-4 py-3 pr-12 sm:px-5">
          <div className="min-w-0 text-left">
            <DialogTitle className="truncate font-serif text-base">
              {file?.name ?? "Media preview"}
            </DialogTitle>
          <DialogDescription className="sr-only">
            Preview of the selected image or document.
          </DialogDescription>
          </div>
        </DialogHeader>
        <div
          className={`min-h-0 flex-1 border bg-muted/20 ${
            file && isPdf ? "overflow-hidden" : "overflow-auto"
          }`}
        >
          {file && isImage && file.isPublic !== false ? (
            <div className="relative mx-auto h-full min-h-[60vh] w-full">
              <MediaImage
                src={file.url}
                alt={file.name}
                fill
                sizes="96vw"
                className="object-contain"
              />
            </div>
          ) : file && isImage && privateImageUrl ? (
            <div className="relative mx-auto h-full min-h-[60vh] w-full">
              <MediaImage
                src={privateImageUrl}
                alt={file.name}
                fill
                sizes="96vw"
                className="object-contain"
              />
            </div>
          ) : file && isImage ? (
            <p role={imageError ? "alert" : "status"} className="py-16 text-center text-sm text-muted-foreground">
              {imageError || "Loading private image preview…"}
            </p>
          ) : file && isPdf ? (
            <MediaPdfViewer url={contentUrl ?? file.url} name={file.name} />
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
              {file.isPublic === false ? (
                <Button type="button" onClick={() => void downloadPrivateFile()}>
                  Download or open file
                </Button>
              ) : (
                <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm text-primary underline">
                  Download or open file
                </a>
              )}
              {downloadError && <p role="alert" className="text-sm text-destructive">{downloadError}</p>}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
