"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Link, usePathname } from "@/app/i18n/routing";
import { api, apiErrorMessage, type PublicationDoc } from "@/lib/api";
import { mdxComponents, mdxRehypePlugins, mdxRemarkPlugins } from "@/components/blog/mdx-renderers";
import { MediaPreviewImage } from "@/components/media-preview-image";
import { useMediaPreview } from "@/components/media-preview-provider";
import { ShareWidget } from "@/components/share-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PublicationContent({ publication }: { publication: PublicationDoc }) {
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
        <div>
          <Badge variant="secondary" className="rounded-none">
            {publication.placement.replaceAll("_", " ").toLowerCase()}
          </Badge>
          <h2 className="mt-3 text-xl font-semibold sm:text-2xl">{publication.title}</h2>
          {publication.summary && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {publication.summary}
            </p>
          )}
        </div>
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
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {publication.fileUrl && (
            <>
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
              <Button asChild variant="outline" className="rounded-none">
                <a href={publication.fileUrl} target="_blank" rel="noreferrer" download>
                  Download attachment
                </a>
              </Button>
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

export function PublicationsPageContent() {
  const [publications, setPublications] = useState<PublicationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getPublications()
      .then((result) => {
        if (!cancelled) {
          setPublications(result.filter((item) =>
            ["PUBLIC_PAGE", "NAVBAR_AND_PAGE", "DIALOG_AND_PAGE"].includes(item.placement),
          ));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Could not load public publications:", error);
          toast.error(apiErrorMessage(error, "Could not load publications."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-[60vh]">
      <section className="bg-inverse px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="mb-4 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em]">
            <span className="h-px w-8 bg-primary" />
            Company updates
            <span className="h-px w-8 bg-primary" />
          </span>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Publications &amp; Promotions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-inverse-foreground/80 sm:text-lg">
            Announcements, product news, and downloadable promotions from Mountain Ceramics Company.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <p className="border p-8 text-center text-sm text-muted-foreground">
            Loading publications…
          </p>
        ) : publications.length === 0 ? (
          <p className="border p-8 text-center text-sm text-muted-foreground">
            There are no current publications.
          </p>
        ) : (
          <div className="space-y-6">
            {publications.map((publication) => (
              <PublicationContent key={publication.id} publication={publication} />
            ))}
          </div>
        )}
      </section>
    </main>
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
