"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import { api, apiErrorMessage, type CatalogueDoc, type Collection, type Product, type PublicationDoc } from "@/lib/api";
import type { BlogPostSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContentKind = "product" | "collection" | "catalogue" | "publication" | "blog";
type ContentItem = {
  kind: ContentKind;
  id: number;
  title: string;
  href: string;
  image?: string | null;
  description?: string | null;
};

const escapeMarkdown = (value: string) =>
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/([\\`*_{}[\]()#+.!<>|])/g, "\\$1")
    .trim();

const safeMarkdownUrl = (value: string) =>
  value.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");

function toMarkdownCard(item: ContentItem) {
  const title = escapeMarkdown(item.title);
  const description = item.description
    ? escapeMarkdown(item.description)
    : `Explore ${title} on the Mountain Ceramics Company website.`;
  const image = item.image?.trim();
  if (image) {
    return `[![${title}](${safeMarkdownUrl(image)})](${safeMarkdownUrl(item.href)})\n\n**[${title}](${safeMarkdownUrl(item.href)})**\n\n${description}`;
  }
  return `> **[${title}](${safeMarkdownUrl(item.href)})**\n>\n> ${description}`;
}

export function ContentLinkPicker({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (markdown: string) => void;
}) {
  const locale = useLocale();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ContentKind | "all">("all");
  const [loadError, setLoadError] = useState("");
  const [productOffset, setProductOffset] = useState(0);
  const [productTotal, setProductTotal] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);

  const productItems = useCallback(
    (products: Product[]): ContentItem[] =>
      products.map((product) => ({
        kind: "product",
        id: product.id,
        title: product.name,
        href: `/products/${product.slug || product.id}`,
        image: product.image,
        description: product.description,
      })),
    [],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    Promise.all([
      api.getCollections(),
      api.getCatalogues(),
      api.getPublications(),
      api.getPublicBlogPosts({ locale, limit: 60 }),
    ])
      .then(([collections, catalogues, publications, blog]) => {
        if (cancelled) return;
        setItems([
          ...collections.map((collection: Collection) => ({
            kind: "collection" as const,
            id: collection.id,
            title: collection.name,
            href: `/collections#collection-${collection.id}`,
            image: collection.image,
            description: collection.description,
          })),
          ...catalogues.map((catalogue: CatalogueDoc) => ({
            kind: "catalogue" as const,
            id: catalogue.id,
            title: catalogue.title,
            href: `/catalogue#catalogue-${catalogue.id}`,
            image: catalogue.coverImage,
            description: catalogue.description,
          })),
          ...publications.map((publication: PublicationDoc) => ({
            kind: "publication" as const,
            id: publication.id,
            title: publication.title,
            href: `/publications/${publication.slug}`,
            image: publication.coverImage,
            description: publication.summary,
          })),
          ...blog.posts.map((post: BlogPostSummary) => ({
            kind: "blog" as const,
            id: post.id,
            title: post.title,
            href: `/blog/${encodeURIComponent(post.slug)}`,
            image: post.coverImage,
            description: post.excerpt,
          })),
        ]);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(apiErrorMessage(error, "Could not load shareable content"));
        toast.error(apiErrorMessage(error, "Could not load shareable content"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingProducts(true);
    const timer = window.setTimeout(async () => {
      setLoadError("");
      try {
        const result = await api.getProducts({
          status: "ACTIVE",
          limit: 60,
          search: query.trim() || undefined,
        });
        if (cancelled) return;
        setItems((current) => [
          ...current.filter((item) => item.kind !== "product"),
          ...productItems(result.products),
        ]);
        setProductOffset(result.products.length);
        setProductTotal(result.total);
      } catch (error) {
        if (cancelled) return;
        setLoadError(apiErrorMessage(error, "Could not load products"));
        toast.error(apiErrorMessage(error, "Could not load products"));
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }, query.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, productItems, query]);

  async function loadMoreProducts() {
    if (loadingProducts || loadingMoreProducts || productOffset >= productTotal) return;
    setLoadingMoreProducts(true);
    setLoadError("");
    try {
      const result = await api.getProducts({
        status: "ACTIVE",
        limit: 60,
        skip: productOffset,
        search: query.trim() || undefined,
      });
      setItems((current) => [...current, ...productItems(result.products)]);
      setProductOffset((offset) => offset + result.products.length);
    } catch (error) {
      setLoadError(apiErrorMessage(error, "Could not load more products"));
      toast.error(apiErrorMessage(error, "Could not load more products"));
    } finally {
    setLoadingMoreProducts(false);
    }
  }

  const visibleItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return items.filter(
      (item) =>
        (kind === "all" || item.kind === kind) &&
        (!term ||
          item.title.toLocaleLowerCase().includes(term) ||
          item.description?.toLocaleLowerCase().includes(term)),
    );
  }, [items, kind, query]);

  const kinds: { value: ContentKind | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "product", label: "Products" },
    { value: "collection", label: "Collections" },
    { value: "catalogue", label: "Catalogues" },
    { value: "publication", label: "Publications" },
    { value: "blog", label: "Blogs" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col rounded-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feature products, collections, and more</DialogTitle>
          <DialogDescription>
            Add a linked image card with a title and description. Product search covers
            the full active catalogue, not just the first page.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="rounded-none pl-8"
            placeholder="Search content"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Tabs value={kind} onValueChange={(value) => setKind(value as ContentKind | "all")}>
          <TabsList className="h-auto flex-wrap justify-start rounded-none">
            {kinds.map((option) => (
              <TabsTrigger key={option.value} value={option.value} className="rounded-none">
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="min-h-0 flex-1 overflow-y-auto border">
          {loading || loadingProducts ? (
            <p className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading shareable content…
            </p>
          ) : loadError ? (
            <p role="alert" className="p-6 text-sm text-destructive">{loadError}</p>
          ) : visibleItems.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No matching published content found.
            </p>
          ) : (
            <ul className="divide-y">
              {visibleItems.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start rounded-none p-3 text-left"
                    onClick={() => {
                      onSelect(toMarkdownCard(item));
                      onOpenChange(false);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.title}</span>
                      <span className="block text-xs capitalize text-muted-foreground">
                        {item.kind}
                        {item.description ? ` · ${item.description}` : ""}
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {!loading && !loadingProducts && !loadError && productOffset < productTotal && (
            <div className="border-t p-3 text-center">
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => void loadMoreProducts()}
                disabled={loadingMoreProducts}
              >
                {loadingMoreProducts && <Loader2 className="animate-spin" />}
                {loadingMoreProducts ? "Loading products…" : "Load more products"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
