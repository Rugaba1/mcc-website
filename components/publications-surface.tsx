"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

import { Link, usePathname } from "@/app/i18n/routing";
import { api, type PublicationDoc } from "@/lib/api";
import { mdxComponents, mdxRehypePlugins, mdxRemarkPlugins } from "@/components/blog/mdx-renderers";
import { MediaPreviewImage } from "@/components/media-preview-image";
import { MediaPdfViewer } from "@/components/media-pdf-viewer";
import { useMediaPreview } from "@/components/media-preview-provider";
import { ShareWidget } from "@/components/share-widget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PublicationContentDoc = Omit<PublicationDoc, "placement"> & {
  placement: string;
};

export function PublicationContent({
  publication,
  showPdfInline = false,
  showTitle = true,
}: {
  publication: PublicationContentDoc;
  showPdfInline?: boolean;
  showTitle?: boolean;
}) {
  const { openPreview } = useMediaPreview();
  const pdf = publication.fileUrl?.split(/[?#]/)[0]?.toLowerCase().endsWith(".pdf");

  return (
    <article
      id={`publication-${publication.id}`}
      className="overflow-hidden border bg-card shadow-sm"
    >
      {publication.coverImage && (
        <MediaPreviewImage
          src={publication.coverImage}
          alt={publication.title}
          className="my-0"
        />
      )}
      <div className="space-y-4 p-5 sm:p-7">
        {showTitle && (
          <div className="text-center">
            <h1 className="font-playfair text-3xl font-normal tracking-tight sm:text-4xl">
              {publication.title}
            </h1>
          {publication.summary && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {publication.summary}
            </p>
          )}
          </div>
        )}
        {publication.contentMarkdown && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={mdxRemarkPlugins}
              rehypePlugins={mdxRehypePlugins}
              components={mdxComponents}
            >
              {publication.contentMarkdown}
            </ReactMarkdown>
          </div>
        )}
        {showPdfInline && pdf && publication.fileUrl && (
          <div
            className="overflow-hidden border"
            role="group"
            aria-label={`${publication.title} PDF`}
          >
            <MediaPdfViewer
              url={publication.fileUrl}
              name={publication.title}
              toolbar
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {publication.fileUrl && (
            <>
              {!(showPdfInline && pdf) && (
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-none"
                  onClick={() =>
                    openPreview({
                      url: publication.fileUrl!,
                      name: publication.title,
                      mimeType: pdf ? "application/pdf" : undefined,
                    })
                  }
                >
                  Preview attachment
                </Button>
              )}
              {!pdf && (
                <Button asChild variant="outline" className="rounded-none">
                  <a href={publication.fileUrl} download>
                    Download attachment
                  </a>
                </Button>
              )}
            </>
          )}
          <ShareWidget
            title={publication.title}
            text={publication.summary}
            path={`/publications/${publication.slug}`}
          />
          <Button asChild variant="outline" className="rounded-none">
            <Link href={`/publications/${publication.slug}`}>View publication</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function PublicationsSurface() {
  const pathname = usePathname();
  const [publications, setPublications] = useState<PublicationDoc[]>([]);
  const [dialogPublication, setDialogPublication] = useState<PublicationDoc | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getPublications()
      .then((result) => {
        if (!cancelled) setPublications(result);
      })
      .catch((error: unknown) => {
        console.error("Could not load publication placements:", error);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const next = publications.find((item) =>
      ["HOME_DIALOG", "DIALOG_AND_PAGE"].includes(item.placement),
    );
    if (!next || sessionStorage.getItem(`mcc-publication-dismissed-${next.id}`)) return;
    setDialogPublication(next);
  }, [pathname, publications]);

  const closeDialog = (open: boolean) => {
    if (open || !dialogPublication) return;
    sessionStorage.setItem(`mcc-publication-dismissed-${dialogPublication.id}`, "1");
    setDialogPublication(null);
  };

  const banner = publications.find((item) =>
    ["NAVBAR", "NAVBAR_AND_PAGE"].includes(item.placement),
  );

  return (
    <>
      {banner && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
          <span className="font-semibold">{banner.title}</span>
          {banner.summary && <span>{banner.summary}</span>}
          <Link className="underline underline-offset-2" href={`/publications/${banner.slug}`}>Learn more</Link>
        </div>
      )}
      <Dialog open={Boolean(dialogPublication)} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl">
          {dialogPublication && (
            <>
              <DialogHeader>
                <DialogTitle>{dialogPublication.title}</DialogTitle>
                <DialogDescription>{dialogPublication.summary || "A current announcement from Mountain Ceramics Company."}</DialogDescription>
              </DialogHeader>
              <PublicationContent publication={dialogPublication} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
