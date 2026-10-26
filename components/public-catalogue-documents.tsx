import Image from "next/image";
import { FileText } from "lucide-react";

import type { CatalogueDoc } from "@/lib/api";
import { CataloguePreviewButton } from "@/components/catalogue-preview-button";
import { ShareWidget } from "@/components/share-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PublicCatalogueDocuments({
  catalogues,
}: {
  catalogues: CatalogueDoc[];
}) {
  if (catalogues.length === 0) return null;

  return (
    <section aria-labelledby="downloadable-catalogues" className="mt-16 border-t pt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Downloadable resources
          </p>
          <h2 id="downloadable-catalogues" className="mt-2 text-2xl font-bold">
            Product catalogues
          </h2>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          Browse product catalogues and announcements from Mountain Ceramics Company.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {catalogues.map((catalogue) => {
          const fileIsImage =
            /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(catalogue.fileUrl);
          const coverImage = catalogue.coverImage || (fileIsImage ? catalogue.fileUrl : "");
          const mimeType = fileIsImage
            ? "image/*"
            : /\.pdf(?:[?#].*)?$/i.test(catalogue.fileUrl)
              ? "application/pdf"
              : undefined;

          return (
            <article
              key={catalogue.id}
              id={`catalogue-${catalogue.id}`}
              className="overflow-hidden border bg-card"
            >
              <CataloguePreviewButton
                file={{
                  url: coverImage || catalogue.fileUrl,
                  name: coverImage ? `${catalogue.title} cover` : catalogue.title,
                  mimeType: coverImage ? "image/*" : mimeType,
                }}
                className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted"
              >
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt={catalogue.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="size-12" />
                    <span className="text-xs uppercase">
                      {mimeType === "application/pdf" ? "PDF document" : "Document"}
                    </span>
                  </div>
                )}
                {catalogue.featured && (
                  <Badge className="absolute left-3 top-3 rounded-none">
                    Featured
                  </Badge>
                )}
              </CataloguePreviewButton>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="uppercase tracking-wider">{catalogue.category}</span>
                  {catalogue.year && <span>{catalogue.year}</span>}
                </div>
                <div>
                  <h3 className="font-semibold">{catalogue.title}</h3>
                  {catalogue.description && (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {catalogue.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CataloguePreviewButton
                    file={{ url: catalogue.fileUrl, name: catalogue.title, mimeType }}
                    className="inline-flex h-8 items-center justify-center border border-transparent bg-secondary px-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                  >
                    View document
                  </CataloguePreviewButton>
                  <ShareWidget
                    title={catalogue.title}
                    text={catalogue.description}
                    path={`/catalogue#catalogue-${catalogue.id}`}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
