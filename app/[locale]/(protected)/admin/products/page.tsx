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
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { useFormatters } from "@/contexts/format-context";

const PAGE_SIZE = 10;
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  DRAFT: "bg-warning/10 text-warning",
  ARCHIVED: "bg-muted text-muted-foreground",
};
function summarize(p: Product) {
  const all = p.variants ?? [];
  const active = all.filter((v) => v.active !== false);
  const prices = active.map((v) => Number(v.pricePerSqm)).filter((n) => Number.isFinite(n) && n > 0);
  const containerPrices = active
    .map((v) => Number(v.containerPricePerSqm))
    .filter((n) => Number.isFinite(n) && n > 0);
  const sizes = Array.from(new Set(active.map((v) => v.size).filter(Boolean)));
  return {
    total: all.length,
    active: active.length,
    inactive: all.length - active.length,
    fromSqm: prices.length ? Math.min(...prices) : null,
    fromContainer: containerPrices.length ? Math.min(...containerPrices) : null,
    sizes: sizes.length ? sizes.join(", ") : p.sizes, // fall back to the legacy string
  };
}
export default function AdminProductsPage() {
  const { number, baseCurrency } = useFormatters();
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
        <PermissionGate required={PERM.PRODUCTS_CREATE}>
          <Button className="rounded-none" onClick={openCreate}>
            <Plus /> Add product
          </Button>
        </PermissionGate>
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
              <TableHead>Status</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && products.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                    <Skeleton className="h-5 w-full rounded-none" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
          ) : products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8}>                          {/* was 7 */}
              <div className="flex flex-col items-center gap-2 py-14 text-sm text-muted-foreground">
                <Package className="size-7" />
                {hasFilters ? "No products match your filters." : "No products yet."}
                {!hasFilters && (
                  <PermissionGate required={PERM.PRODUCTS_CREATE}>
                    <Button className="mt-1 rounded-none" onClick={openCreate}>
                      <Plus /> Add your first product
                    </Button>
                  </PermissionGate>
                )}
              </div>
            </TableCell>
          </TableRow>
          ) : (
        products.map((p) => {
          const s = summarize(p);
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
                {p.featured && <Star className="size-3.5 fill-warning text-warning" aria-label="Featured" />}
              </div>
              <p className="text-xs text-muted-foreground">{p.collection || "No collection"}</p>
            </TableCell>
            <TableCell>{p.categoryLabel}</TableCell>
            <TableCell className="max-w-40 truncate text-muted-foreground">{s.sizes || "—"}</TableCell>

            {/* VARIANTS: new per-m² content */}
            <TableCell>
              {s.active > 0 ? (
                <>
                  <span>{s.active}</span>
                  {s.inactive > 0 && (
                    <span className="text-xs text-muted-foreground"> (+{s.inactive} inactive)</span>
                  )}
                  {s.fromSqm !== null && (
                    <p className="text-xs text-muted-foreground">from {number(s.fromSqm)} {baseCurrency}/m²</p>
                  )}
                  {s.fromContainer !== null && (
                    <p className="text-xs text-muted-foreground">
                      container from {number(s.fromContainer)} {baseCurrency}/m²
                    </p>
                  )}
                </>
              ) : (
                <span className="text-xs text-warning dark:text-warning">
                  {s.total ? "All inactive, can’t be bought" : "None, can’t be bought"}
                </span>
              )}
            </TableCell>

            {/* STATUS: moved here, matches the header order */}
            <TableCell>
              <Badge variant="secondary" className={`rounded-none ${STATUS_STYLES[p.status] ?? ""}`}>
                {p.status}
              </Badge>
            </TableCell>

            {/* BADGE */}
            <TableCell>
              {p.badge ? (
                <Badge variant="secondary" className="rounded-none">{p.badge}</Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>

            <TableCell>
              <div className="flex justify-end gap-1">
                <PermissionGate required={PERM.PRODUCTS_UPDATE}>
                  <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                    <Pencil />
                  </Button>
                </PermissionGate>
                <PermissionGate required={PERM.VARIANTS_MANAGE}>
                  <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => setVariantsFor(p)} aria-label={`Variants of ${p.name}`}>
                    <Boxes />
                  </Button>
                </PermissionGate>
                <PermissionGate required={PERM.PRODUCTS_DELETE}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-none text-destructive hover:text-destructive"
                    onClick={() => setDeleting(p)}
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 />
                  </Button>
                </PermissionGate>
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

    <PermissionGate required={editing ? PERM.PRODUCTS_UPDATE : PERM.PRODUCTS_CREATE}>
      <ProductSheet open={sheetOpen} onOpenChange={setSheetOpen} product={editing} onSaved={refresh} />
    </PermissionGate>

    <PermissionGate required={PERM.PRODUCTS_DELETE}>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this product?"
        description={`“${deleting?.name ?? ""}” and all of its variants will be removed. This can’t be undone.`}
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </PermissionGate>
  </main >
    <PermissionGate required={PERM.VARIANTS_MANAGE}>
      <VariantsSheet product={variantsFor} onOpenChange={(o) => !o && setVariantsFor(null)} onChanged={refresh} />
    </PermissionGate>
  </>
  );
}