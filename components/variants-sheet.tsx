"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type AdminVariant, type Product, type VariantInput } from "@/lib/api";
import { ColorField, Swatch, colorName } from "@/components/color-field";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageField } from "@/components/file-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

type F = Record<"sku" | "size" | "finish" | "color" | "thicknessMm" | "shadeCode" | "piecesPerBox" | "sqmPerBox" | "weightKgPerBox" | "pricePerSqm" | "pricePerBox" | "compareAtPrice" | "image" | "textureUrl" | "stockBoxes" | "lowStockThreshold", string> & { active: boolean };

const EMPTY: F = {
  sku: "", size: "", finish: "", color: "", thicknessMm: "", shadeCode: "", piecesPerBox: "1", sqmPerBox: "",
  weightKgPerBox: "", pricePerSqm: "", pricePerBox: "", compareAtPrice: "", image: "", textureUrl: "",
  stockBoxes: "0", lowStockThreshold: "0", active: true,
};

const s = (v: unknown) => (v == null ? "" : String(v));
const num = (v: string) => (v.trim() === "" ? null : Number(v));

const fromVariant = (v: AdminVariant): F => ({
  sku: v.sku, size: v.size, finish: s(v.finish), color: s(v.color), thicknessMm: s(v.thicknessMm), shadeCode: s(v.shadeCode),
  piecesPerBox: s(v.piecesPerBox), sqmPerBox: s(v.sqmPerBox), weightKgPerBox: s(v.weightKgPerBox), pricePerSqm: s(v.pricePerSqm),
  pricePerBox: s(v.pricePerBox), compareAtPrice: s(v.compareAtPrice), image: s(v.image), textureUrl: s(v.textureUrl),
  stockBoxes: "0", lowStockThreshold: s(v.lowStockThreshold), active: v.active,
});

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function VariantsSheet({ product, onOpenChange, onChanged }: { product: Product | null; onOpenChange: (o: boolean) => void; onChanged: () => void }) {
  const [rows, setRows] = useState<AdminVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<F | null>(null); // null = list view
  const [editId, setEditId] = useState<number | null>(null);
  const [manualBoxPrice, setManualBoxPrice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminVariant | null>(null);

  const load = useCallback(async () => {
    if (!product) return;
    setLoading(true);
    try {
      setRows(await api.getVariants(product.id));
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load variants"));
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    setForm(null);
    setEditId(null);
    if (product) load();
  }, [product, load]);

  const set = <K extends keyof F>(k: K, v: F[K]) => {
    setErrors((e) => ({ ...e, [k]: "" }));
    setForm((f) => {
      if (!f) return f;
      const next = { ...f, [k]: v };
      // price per box follows price per m² × m² per box until it is edited by hand
      if ((k === "pricePerSqm" || k === "sqmPerBox") && !manualBoxPrice) {
        const p = Number(next.pricePerSqm), q = Number(next.sqmPerBox);
        next.pricePerBox = p > 0 && q > 0 ? String(Math.round(p * q)) : "";
      }
      return next;
    });
  };

  const startNew = () => { setEditId(null); setManualBoxPrice(false); setErrors({}); setForm(EMPTY); };
  const startEdit = (v: AdminVariant) => { setEditId(v.id); setManualBoxPrice(true); setErrors({}); setForm(fromVariant(v)); };

  const makeSku = () =>
    set("sku", [product?.name, form?.size, form?.finish, form?.shadeCode].filter(Boolean).join("-").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64));

  const submit = async () => {
    if (!form || !product) return;
    const e: Record<string, string> = {};
    if (form.sku.trim().length < 2) e.sku = "Enter a SKU";
    if (!form.size.trim()) e.size = "Enter a size";
    if (!(Number(form.sqmPerBox) > 0)) e.sqmPerBox = "Must be above 0";
    if (!(Number(form.pricePerSqm) >= 0) || form.pricePerSqm === "") e.pricePerSqm = "Enter a price";
    if (!(Number(form.pricePerBox) >= 0) || form.pricePerBox === "") e.pricePerBox = "Enter a price";
    if (!(Number(form.piecesPerBox) >= 1)) e.piecesPerBox = "At least 1";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload: VariantInput = {
      sku: form.sku.trim(), size: form.size.trim(), finish: form.finish.trim(), color: form.color, shadeCode: form.shadeCode.trim(),
      thicknessMm: num(form.thicknessMm), piecesPerBox: Number(form.piecesPerBox), sqmPerBox: Number(form.sqmPerBox),
      weightKgPerBox: num(form.weightKgPerBox), pricePerSqm: Number(form.pricePerSqm), pricePerBox: Number(form.pricePerBox),
      compareAtPrice: num(form.compareAtPrice), image: form.image, textureUrl: form.textureUrl, active: form.active,
    };

    setSaving(true);
    try {
      if (editId) await api.updateVariant(editId, payload);
      else await api.createVariant(product.id, { ...payload, stockBoxes: Number(form.stockBoxes) || 0, lowStockThreshold: Number(form.lowStockThreshold) || 0 });
      toast.success(editId ? "Variant updated" : "Variant added");
      setForm(null);
      await load();
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save the variant"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (v: AdminVariant, active: boolean) => {
    setRows((r) => r.map((x) => (x.id === v.id ? { ...x, active } : x)));
    try { await api.updateVariant(v.id, { active }); onChanged(); }
    catch (err) { toast.error(apiErrorMessage(err, "Could not update")); load(); }
  };

  const remove = async () => {
    if (!deleting) return;
    try { await api.deleteVariant(deleting.id); toast.success("Variant deleted"); setDeleting(null); await load(); onChanged(); }
    catch (err) { toast.error(apiErrorMessage(err, "Could not delete the variant")); }
  };

  return (
    <Sheet open={!!product} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 rounded-none p-0 sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle>Variants · {product?.name}</SheetTitle>
          <SheetDescription>Each size, finish or shade customers can buy, with its price and stock.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!form ? (
            <div className="space-y-4">
              <Button className="rounded-none" onClick={startNew}><Plus /> Add variant</Button>
              <div className="border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead><TableHead>Spec</TableHead><TableHead>Price / box</TableHead>
                      <TableHead>Stock</TableHead><TableHead>Active</TableHead><TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && rows.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No variants yet. Add one so this product can be bought.</TableCell></TableRow>
                    ) : rows.map((v) => (
                      <TableRow key={v.id} className={v.active ? "" : "opacity-60"}>
                        <TableCell className="font-medium">{v.sku}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5">
                            {v.color && <Swatch value={v.color} />}{v.size}{v.finish ? ` · ${v.finish}` : ""}
                          </span>
                          <span className="text-xs capitalize text-muted-foreground">{v.color ? colorName(v.color) : "No color"}{v.shadeCode ? ` · shade ${v.shadeCode}` : ""}</span>
                        </TableCell>
                        <TableCell className="tabular-nums">{money.format(v.pricePerBox)} RWF<span className="block text-xs text-muted-foreground">{v.sqmPerBox} m² per box</span></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`rounded-none ${v.stockBoxes === 0 ? "border-red-500/40 text-red-600" : v.stockBoxes <= v.lowStockThreshold ? "border-amber-500/40 text-amber-600" : ""}`}>{v.stockBoxes} boxes</Badge>
                        </TableCell>
                        <TableCell><Checkbox className="rounded-none" checked={v.active} onCheckedChange={(c) => toggleActive(v, c === true)} aria-label="Active" /></TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => startEdit(v)} aria-label="Edit"><Pencil /></Button>
                            <Button variant="ghost" size="icon" className="size-8 rounded-none text-destructive hover:text-destructive" onClick={() => setDeleting(v)} aria-label="Delete"><Trash2 /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">To change stock on an existing variant, use the Inventory page.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <h3 className="font-semibold">{editId ? "Edit variant" : "New variant"}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Size" error={errors.size}><Input className="rounded-none" value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="60x60" /></Field>
                <Field label="Finish"><Input className="rounded-none" value={form.finish} onChange={(e) => set("finish", e.target.value)} placeholder="Matt, Polished" /></Field>
                <Field label="Shade / batch"><Input className="rounded-none" value={form.shadeCode} onChange={(e) => set("shadeCode", e.target.value)} /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Field label="SKU" error={errors.sku}><Input className="rounded-none" value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
                <div className="flex items-end"><Button type="button" variant="outline" className="rounded-none" onClick={makeSku}><Wand2 /> Generate</Button></div>
              </div>
              <Field label="Color"><ColorField value={form.color} onChange={(v) => set("color", v)} /></Field>
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Pieces per box" error={errors.piecesPerBox}><Input className="rounded-none" type="number" min={1} value={form.piecesPerBox} onChange={(e) => set("piecesPerBox", e.target.value)} /></Field>
                <Field label="m² per box" error={errors.sqmPerBox}><Input className="rounded-none" type="number" step="0.001" value={form.sqmPerBox} onChange={(e) => set("sqmPerBox", e.target.value)} /></Field>
                <Field label="Thickness (mm)"><Input className="rounded-none" type="number" step="0.1" value={form.thicknessMm} onChange={(e) => set("thicknessMm", e.target.value)} /></Field>
                <Field label="Weight / box (kg)"><Input className="rounded-none" type="number" step="0.01" value={form.weightKgPerBox} onChange={(e) => set("weightKgPerBox", e.target.value)} /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Price per m² (RWF)" error={errors.pricePerSqm}><Input className="rounded-none" type="number" value={form.pricePerSqm} onChange={(e) => set("pricePerSqm", e.target.value)} /></Field>
                <Field label="Price per box (RWF)" error={errors.pricePerBox}>
                  <Input className="rounded-none" type="number" value={form.pricePerBox} onChange={(e) => { setManualBoxPrice(true); set("pricePerBox", e.target.value); }} />
                </Field>
                <Field label="Compare-at price"><Input className="rounded-none" type="number" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="Strike-through" /></Field>
              </div>
              {!editId && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Starting stock (boxes)"><Input className="rounded-none" type="number" min={0} value={form.stockBoxes} onChange={(e) => set("stockBoxes", e.target.value)} /></Field>
                  <Field label="Low stock alert at (boxes)"><Input className="rounded-none" type="number" min={0} value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} /></Field>
                </div>
              )}
              <Field label="Swatch image"><ImageField value={form.image} onChange={(v) => set("image", v)} /></Field>
              <Field label="Seamless texture (for the room visualizer)"><ImageField value={form.textureUrl} onChange={(v) => set("textureUrl", v)} /></Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox className="rounded-none" checked={form.active} onCheckedChange={(c) => set("active", c === true)} /> Available to buy
              </label>
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" className="rounded-none" onClick={() => setForm(null)} disabled={saving}>Back</Button>
                <Button className="rounded-none" onClick={submit} disabled={saving}>{saving && <Loader2 className="animate-spin" />}{editId ? "Save changes" : "Add variant"}</Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>

      <ConfirmDelete open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete this variant?"
        description={`${deleting?.sku ?? ""} and its stock record will be removed. Past orders keep their own copy. Untick “Active” instead to just hide it.`}
        busy={false} onConfirm={remove} />
    </Sheet>
  );
}
