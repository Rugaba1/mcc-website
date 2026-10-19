"use client";

import { useEffect, useState } from "react";
import { Boxes, Package, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, CATEGORY_OPTIONS, type Product } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { DataPagination } from "@/components/admin/data-pagination";
import { ProductSheet } from "@/components/admin/product-sheet";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VariantsSheet } from "@/components/variants-sheet";

const PAGE_SIZE = 10;
const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [variantsFor, setVariantsFor] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Back to page 1 whenever the filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getProducts({
        search: debouncedSearch || undefined,
        category: category === "all" ? undefined : category,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.products);
        setTotalPages(Math.max(1, res.totalPages));
        setTotal(res.total ?? res.products.length);
      })
      .catch((e) => !cancelled && toast.error(apiErrorMessage(e, "Failed to load products")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category, page, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setSheetOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.deleteProduct(deleting.id);
      toast.success(`“${deleting.name}” deleted`);
      setDeleting(null);
      // if that was the last row on this page, step back one page
      if (products.length === 1 && page > 1) setPage(page - 1);
      else refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not delete the product"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const hasFilters = !!search || category !== "all";

  return (<>
    <main className="flex-1 space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Tile designs shown on the public catalog.</p>
        </div>
        <Button className="rounded-none" onClick={openCreate}>
          <Plus /> Add product
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="rounded-none pl-8"
            placeholder="Search name, color, size, material…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] rounded-none">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all" className="rounded-none">All categories</SelectItem>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value} className="rounded-none">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            className="rounded-none"
            onClick={() => {
              setSearch("");
              setCategory("all");
            }}
          >
            <X /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sizes</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && products.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full rounded-none" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center gap-2 py-14 text-sm text-muted-foreground">
                    <Package className="size-7" />
                    {hasFilters ? "No products match your filters." : "No products yet."}
                    {!hasFilters && (
                      <Button className="mt-1 rounded-none" onClick={openCreate}>
                        <Plus /> Add your first product
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const variants = p.variants ?? [];
                const from = variants.length ? Math.min(...variants.map((v) => v.pricePerBox)) : null;
                return (
                  <TableRow key={p.id} className={loading ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="size-11 overflow-hidden border bg-muted">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.name} className="size-full object-cover" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{p.name}</span>
                        {p.featured && <Star className="size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.collection || "No collection"}</p>
                    </TableCell>
                    <TableCell>{p.categoryLabel}</TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground">{p.sizes || "—"}</TableCell>
                    <TableCell>
                      {variants.length ? (
                        <>
                          <span>{variants.length}</span>
                          <p className="text-xs text-muted-foreground">from {money.format(from!)} RWF</p>
                        </>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400">None, can’t be bought</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.badge ? (
                        <Badge variant="secondary" className="rounded-none">{p.badge}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => setVariantsFor(p)} aria-label={`Variants of ${p.name}`}><Boxes /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-none text-destructive hover:text-destructive"
                          onClick={() => setDeleting(p)}
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <DataPagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} />
      </div>

      <ProductSheet open={sheetOpen} onOpenChange={setSheetOpen} product={editing} onSaved={refresh} />

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this product?"
        description={`“${deleting?.name ?? ""}” and all of its variants will be removed. This can’t be undone.`}
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </main>
    <VariantsSheet product={variantsFor} onOpenChange={(o) => !o && setVariantsFor(null)} onChanged={refresh} />
  </>
  );
}