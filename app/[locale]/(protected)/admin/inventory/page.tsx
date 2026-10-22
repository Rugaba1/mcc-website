"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, Download, Loader2, PackageX, Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type InventoryItem } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
 
import { DataPagination } from "@/components/admin/data-pagination";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { colorName, Swatch } from "@/components/color-field";

const PAGE_SIZE = 15;
type State = "ok" | "low" | "out";
const stateOf = (i: InventoryItem): State => (i.stockSqm <= 0 ? "out" : i.stockSqm <= i.lowStockThreshold ? "low" : "ok");
const STATE_STYLE: Record<State, string> = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  low: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  out: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};
const STATE_LABEL: Record<State, string> = { ok: "In stock", low: "Low stock", out: "Out of stock" };

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search, 250);
  const [filter, setFilter] = useState<"all" | State>("all");
  const [sort, setSort] = useState("product");
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.getInventory()); }
    catch (e) { toast.error(apiErrorMessage(e, "Failed to load inventory")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => setPage(1), [q, filter, sort]);

  const totals = useMemo(() => ({
    variants: items.length,
    boxes: items.reduce((n, i) => n + i.stockSqm, 0),
    low: items.filter((i) => stateOf(i) === "low").length,
    out: items.filter((i) => stateOf(i) === "out").length,
  }), [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = items.filter((i) =>
      (filter === "all" || stateOf(i) === filter) &&
      (!term || [i.productName, i.sku, i.size, i.finish, i.color && colorName(i.color)].some((v) => v?.toLowerCase().includes(term))));
    return [...list].sort((a, b) =>
      sort === "stock-asc" ? a.stockSqm - b.stockSqm : sort === "stock-desc" ? b.stockSqm - a.stockSqm : a.productName.localeCompare(b.productName));
  }, [items, q, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [["Product", "SKU", "Size", "Finish", "Color", "m²", "Alert at", "Status"].join(","),
    ...filtered.map((i) => [i.productName, i.sku, i.size, i.finish, i.color ? colorName(i.color) : "", i.stockSqm, i.lowStockThreshold, STATE_LABEL[stateOf(i)]].map(esc).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const stats = [
    { label: "Variants", value: totals.variants, icon: Boxes, tone: "" },
    { label: "m² in stock", value: totals.boxes, icon: Boxes, tone: "" },
    { label: "Low stock", value: totals.low, icon: AlertTriangle, tone: totals.low ? STATE_STYLE.low : "" },
    { label: "Out of stock", value: totals.out, icon: PackageX, tone: totals.out ? STATE_STYLE.out : "" },
  ];

  return (
    <main className="flex-1 space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Stock levels for every variant, counted in m².</p>
        </div>
        <Button variant="outline" className="rounded-none" onClick={exportCsv} disabled={!filtered.length}><Download /> Export CSV</Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="rounded-none py-0">
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`flex size-10 items-center justify-center border ${tone || "bg-muted text-muted-foreground"}`}><Icon className="size-5" /></span>
              <div><p className="text-2xl font-semibold tabular-nums">{loading ? "–" : value.toLocaleString()}</p><p className="text-xs text-muted-foreground">{label}</p></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="rounded-none pl-8" placeholder="Search product, SKU, size, color…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="rounded-none">
            <TabsTrigger value="all" className="rounded-none">All</TabsTrigger>
            <TabsTrigger value="low" className="rounded-none">Low</TabsTrigger>
            <TabsTrigger value="out" className="rounded-none">Out</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[170px] rounded-none"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="product" className="rounded-none">Product A–Z</SelectItem>
            <SelectItem value="stock-asc" className="rounded-none">Stock: low to high</SelectItem>
            <SelectItem value="stock-desc" className="rounded-none">Stock: high to low</SelectItem>
          </SelectContent>
        </Select>
        {(search || filter !== "all") && <Button variant="ghost" className="rounded-none" onClick={() => { setSearch(""); setFilter("all"); }}><X /> Clear</Button>}
      </div>

      <div className="border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Variant</TableHead>
              <TableHead className="text-right">m²</TableHead><TableHead className="text-right">Alert at</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-28 text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && items.length === 0 ? Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton className="h-5 w-full rounded-none" /></TableCell>)}</TableRow>
            )) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-14 text-center text-sm text-muted-foreground">{items.length ? "Nothing matches your filters." : "No variants yet. Add variants from the Products page."}</TableCell></TableRow>
            ) : rows.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.productName}</TableCell>
                <TableCell className="text-muted-foreground">{i.sku}</TableCell>
                <TableCell><span className="flex items-center gap-1.5">{i.color && <Swatch value={i.color} />}{i.size}{i.finish ? ` · ${i.finish}` : ""}</span></TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{i.stockSqm}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{i.lowStockThreshold}</TableCell>
                <TableCell><Badge variant="outline" className={`rounded-none ${STATE_STYLE[stateOf(i)]}`}>{STATE_LABEL[stateOf(i)]}</Badge></TableCell>
                <TableCell className="text-right"><Button size="sm" variant="outline" className="rounded-none" onClick={() => setAdjusting(i)}><SlidersHorizontal /> Adjust</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataPagination page={current} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <AdjustDialog item={adjusting} onClose={() => setAdjusting(null)} onSaved={load} />
    </main>
  );
}

function AdjustDialog({ item, onClose, onSaved }: { item: InventoryItem | null; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<"set" | "add" | "remove">("add");
  const [qty, setQty] = useState("");
  const [threshold, setThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (item) { setMode("add"); setQty(""); setThreshold(String(item.lowStockThreshold)); } }, [item]);

  const amount = Math.max(0, Math.floor(Number(qty) || 0));
  const result = !item ? 0 : mode === "set" ? amount : mode === "add" ? item.stockSqm + amount : item.stockSqm - amount;
  const invalid = !item || result < 0 || (qty.trim() === "" && Number(threshold) === item.lowStockThreshold);

  const save = async () => {
    if (!item || result < 0) return;
    setSaving(true);
    try {
      await api.updateStock(item.id, { stockSqm: result, lowStockThreshold: Math.max(0, Math.floor(Number(threshold) || 0)) });
      toast.success(`${item.sku} now has ${result} m²`);
      onSaved();
      onClose();
    } catch (e) { toast.error(apiErrorMessage(e, "Could not update stock")); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{item?.productName} · {item?.sku} · currently {item?.stockSqm} m²</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="add" className="flex-1 rounded-none">Add</TabsTrigger>
              <TabsTrigger value="remove" className="flex-1 rounded-none">Remove</TabsTrigger>
              <TabsTrigger value="set" className="flex-1 rounded-none">Set to</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="space-y-1.5"><Label>m²</Label><Input className="rounded-none" type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /></div>
          <div className="space-y-1.5"><Label>Alert me when stock is at or below</Label><Input className="rounded-none" type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} /></div>
          <p className={`text-sm ${result < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {result < 0 ? "You can’t remove more m² than are in stock." : <>New stock: <span className="font-semibold text-foreground">{result} m²</span></>}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="rounded-none" onClick={save} disabled={saving || invalid}>{saving && <Loader2 className="animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}