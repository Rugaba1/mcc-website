"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { MediaImage } from "@/components/media-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProductPurchase } from "@/components/product-purchase";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api, apiErrorMessage, type Product } from "@/lib/api";

const PAGE_SIZE = 12;

export function CartProductPickerDialog() {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    setError("");
    api.getProducts({
      search: debouncedQuery.trim() || undefined,
      status: "ACTIVE",
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (!active) return;
        setProducts(result.products);
        setTotalPages(result.totalPages);
        setSelectedId(result.products[0]?.id ?? null);
      })
      .catch((cause) => {
        if (!active) return;
        setError(apiErrorMessage(cause, "Could not load products."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, page, debouncedQuery]);

  const selected = useMemo(
    () => products.find((product) => product.id === selectedId) ?? null,
    [products, selectedId],
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Continue shopping
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose products for your order</DialogTitle>
            <DialogDescription>
              Select a product to choose its size and quantity.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-80 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
            <section className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search products"
                  className="pl-9"
                  placeholder="Search products"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {loading ? (
                <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading products…
                </p>
              ) : error ? (
                <p role="alert" className="py-4 text-sm text-destructive">{error}</p>
              ) : products.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">No products found.</p>
              ) : (
                <div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      aria-pressed={product.id === selectedId}
                      onClick={() => setSelectedId(product.id)}
                      className={`min-w-0 border p-2 text-left transition-colors hover:bg-accent ${
                        product.id === selectedId ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <MediaImage
                        src={product.image}
                        alt=""
                        className="aspect-[4/3] w-full bg-muted object-cover"
                      />
                      <span className="mt-2 block truncate text-sm font-medium">
                        {product.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </section>

            <section className="min-w-0 border-t pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              {selected ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">{selected.name}</h3>
                  <ProductPurchase
                    product={selected}
                    onAdded={() => setOpen(false)}
                    className="space-y-4"
                  />
                </div>
              ) : (
                <p className="py-8 text-sm text-muted-foreground">
                  Choose a product to continue.
                </p>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
