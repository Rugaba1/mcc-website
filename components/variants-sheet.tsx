"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type AdminVariant, type Product, type VariantInput } from "@/lib/api";
import { ColorField, Swatch, colorName } from "@/components/color-field";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageField } from "@/components/file-picker";
import { SizeInput } from "@/components/ui/size-input";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { useFormatters } from "@/contexts/format-context";
const FINISHES = ["Matt", "Glossy"] as const;
const NO_FINISH = "__none__";

type F = Record<
  | "sku" | "size" | "finish" | "color" | "thicknessMm" | "shadeCode"
  | "pricePerSqm" | "containerPricePerSqm" | "sqmPerContainer" | "compareAtPrice"
  | "image" | "textureUrl" | "stockSqm" | "reorderLevel",
  string
> & { active: boolean };

const EMPTY: F = {
  sku: "", size: "", finish: "", color: "", thicknessMm: "", shadeCode: "",
  pricePerSqm: "", containerPricePerSqm: "", sqmPerContainer: "", compareAtPrice: "",
  image: "", textureUrl: "", stockSqm: "0", reorderLevel: "0", active: true,
};

const s = (v: unknown) => (v == null ? "" : String(v));
const num = (v: string) => (v.trim() === "" ? null : Number(v));

const fromVariant = (v: AdminVariant): F => ({
  sku: v.sku, size: v.size, finish: s(v.finish), color: s(v.color), thicknessMm: s(v.thicknessMm), shadeCode: s(v.shadeCode),
  pricePerSqm: s(v.pricePerSqm), containerPricePerSqm: s(v.containerPricePerSqm), sqmPerContainer: s(v.sqmPerContainer),
  compareAtPrice: s(v.compareAtPrice), image: s(v.image), textureUrl: s(v.textureUrl),
  stockSqm: "0", reorderLevel: s(v.reorderLevel), active: v.active, // stock itself is changed on the Inventory page
});

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function VariantsSheet({ product, onOpenChange, onChanged }: { product: Product | null; onOpenChange: (o: boolean) => void; onChanged: () => void }) {
  const { money, number, baseCurrency } = useFormatters();
  const [rows, setRows] = useState<AdminVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<F | null>(null); // null = list view
  const [editId, setEditId] = useState<number | null>(null);
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
    setForm((f) => (f ? { ...f, [k]: v } : f));
  };

  const startNew = () => { setEditId(null); setErrors({}); setForm(EMPTY); };
  const startEdit = (v: AdminVariant) => { setEditId(v.id); setErrors({}); setForm(fromVariant(v)); };

  const makeSku = () =>
    set("sku", [product?.name, form?.size, form?.finish, form?.shadeCode].filter(Boolean).join("-").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64));

  const submit = async () => {
    if (!form || !product) return;
    const e: Record<string, string> = {};
    if (form.sku.trim().length < 2) e.sku = "Enter a SKU";
    if (!form.size.trim()) e.size = "Enter a size";
    if (form.pricePerSqm.trim() === "" || !(Number(form.pricePerSqm) > 0)) e.pricePerSqm = "Enter a price above 0";

    // container selling: both fields together, or neither
    const hasCP = form.containerPricePerSqm.trim() !== "";
    const hasCA = form.sqmPerContainer.trim() !== "";
    if (hasCP && !(Number(form.containerPricePerSqm) > 0)) e.containerPricePerSqm = "Must be above 0";
    if (hasCA && !(Number(form.sqmPerContainer) > 0)) e.sqmPerContainer = "Must be above 0";
    if (hasCP && !hasCA) e.sqmPerContainer = "Required when a container price is set";
    if (hasCA && !hasCP) e.containerPricePerSqm = "Required when m² per container is set";

    if (!editId) {
      if (Number(form.stockSqm) < 0 || Number.isNaN(Number(form.stockSqm))) e.stockSqm = "Can't be negative";
      if (Number(form.reorderLevel) < 0 || Number.isNaN(Number(form.reorderLevel))) e.reorderLevel = "Can't be negative";
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload: VariantInput = {
      sku: form.sku.trim(), size: form.size.trim(), finish: form.finish.trim(), color: form.color, shadeCode: form.shadeCode.trim(),
      thicknessMm: num(form.thicknessMm),
      pricePerSqm: Number(form.pricePerSqm),
      containerPricePerSqm: num(form.containerPricePerSqm),
      sqmPerContainer: num(form.sqmPerContainer),
      compareAtPrice: num(form.compareAtPrice),
      image: form.image, textureUrl: form.textureUrl, active: form.active,
    };

    setSaving(true);
    try {
      if (editId) await api.updateVariant(editId, payload);
      else {
        const createPayload = {
          ...payload,
          stockSqm: Number(form.stockSqm) || 0,
          lowStockThreshold: Number(form.reorderLevel) || 0,
        };
        await api.createVariant(product.id, createPayload);
      }
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
    try {
      await api.updateVariant(v.id, {
        sku: v.sku, size: v.size, finish: v.finish ?? "", color: v.color ?? "",
        shadeCode: v.shadeCode ?? "", thicknessMm: v.thicknessMm,
        pricePerSqm: Number(v.pricePerSqm), containerPricePerSqm: v.containerPricePerSqm,
        sqmPerContainer: v.sqmPerContainer, compareAtPrice: v.compareAtPrice,
        image: v.image ?? "", textureUrl: v.textureUrl ?? "", active,
      });
      onChanged();
    }
    catch (err) { toast.error(apiErrorMessage(err, "Could not update")); load(); }
  };

  const remove = async () => {
    if (!deleting) return;
    try { await api.deleteVariant(deleting.id); toast.success("Variant deleted"); setDeleting(null); await load(); onChanged(); }
    catch (err) { toast.error(apiErrorMessage(err, "Could not delete the variant")); }
  };

  return (
    <PermissionGate required={PERM.VARIANTS_MANAGE}>
    <Sheet open={!!product} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 rounded-none p-0 sm:max-w-[min(90vw,1200px)]">
        <SheetHeader className="border-b">
          <SheetTitle>Variants · {product?.name}</SheetTitle>
          <SheetDescription>Each size, finish or shade customers can buy, with its price per m² and stock in m².</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!form ? (
            <div className="space-y-4">
              <PermissionGate required={[PERM.VARIANTS_MANAGE, PERM.PRICING_MANAGE]}>
                <Button className="rounded-none" onClick={startNew}><Plus /> Add variant</Button>
              </PermissionGate>
              <div className="border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead><TableHead>Spec</TableHead><TableHead>Price / m²</TableHead>
                      <TableHead>Stock</TableHead><TableHead>Active</TableHead><TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && rows.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No variants yet. Add one so this product can be bought.</TableCell></TableRow>
                    ) : rows.map((v) => {
                      const onHand = Number(v.stockSqm ?? 0);
                      const reserved = Number(v.reservedSqm ?? 0);
                      const available = onHand - reserved;
                      const low = onHand <= Number(v.reorderLevel ?? 0);
                      const container = Number(v.containerPricePerSqm);
                      return (
                        <TableRow key={v.id} className={v.active ? "" : "opacity-60"}>
                          <TableCell className="font-medium">{v.sku}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5">
                              {v.color && <Swatch value={v.color} />}{v.size}{v.finish ? ` · ${v.finish}` : ""}
                            </span>
                            <span className="text-xs capitalize text-muted-foreground">{v.color ? colorName(v.color) : "No color"}{v.shadeCode ? ` · shade ${v.shadeCode}` : ""}</span>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {money(Number(v.pricePerSqm), v.currency)}
                            <span className="block text-xs text-muted-foreground">
                              {container > 0 ? `Container: ${money(container, v.currency)}/m²` : "Not sold by container"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded-none ${available <= 0 ? "border-destructive/40 text-destructive" : low ? "border-warning/40 text-warning" : ""}`}
                            >
                              {number(available, { maximumFractionDigits: 2 })} m²
                            </Badge>
                            {reserved > 0 && <span className="block text-xs text-muted-foreground">{number(reserved, { maximumFractionDigits: 2 })} m² reserved</span>}
                          </TableCell>
                          <TableCell><Checkbox className="rounded-none" checked={v.active} onCheckedChange={(c) => toggleActive(v, c === true)} aria-label="Active" /></TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => startEdit(v)} aria-label="Edit"><Pencil /></Button>
                              <Button variant="ghost" size="icon" className="size-8 rounded-none text-destructive hover:text-destructive" onClick={() => setDeleting(v)} aria-label="Delete"><Trash2 /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">Stock is in m². To change stock on an existing variant, use the Inventory page.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <h3 className="font-semibold">{editId ? "Edit variant" : "New variant"}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Size" error={errors.size}><Input className="rounded-none" value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="60x60" /></Field>
                  <Field label="Finish">
                    <Select
                      value={form.finish || NO_FINISH}
                      onValueChange={(v) => set("finish", v === NO_FINISH ? "" : v)}
                    >
                      <SelectTrigger className="w-full rounded-none">
                        <SelectValue placeholder="Select finish" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value={NO_FINISH}>None</SelectItem>
                        {FINISHES.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                        {form.finish && !FINISHES.includes(form.finish as (typeof FINISHES)[number]) && (
                          <SelectItem value={form.finish}>{form.finish}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                <Field label="Shade / batch"><Input className="rounded-none" value={form.shadeCode} onChange={(e) => set("shadeCode", e.target.value)} /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Field label="SKU" error={errors.sku}><Input className="rounded-none" value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
                <div className="flex items-end"><Button type="button" variant="outline" className="rounded-none" onClick={makeSku}><Wand2 /> Generate</Button></div>
              </div>
              <Field label="Color"><ColorField value={form.color} onChange={(v) => set("color", v)} /></Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <PermissionGate required={PERM.PRICING_MANAGE}>
                  <Field label={`Price per m² (${baseCurrency})`} error={errors.pricePerSqm}>
                    <Input className="rounded-none" type="number" min={1} value={form.pricePerSqm} onChange={(e) => set("pricePerSqm", e.target.value)} />
                  </Field>
                  <Field label="Compare-at price / m²" hint="Strike-through price">
                    <Input className="rounded-none" type="number" min={0} value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
                  </Field>
                </PermissionGate>
                <SizeInput
                  id="variant-thickness-mm"
                  label="Thickness"
                  value={form.thicknessMm}
                  unit="mm"
                  min={0}
                  step={0.1}
                  onValueChange={(value) => set("thicknessMm", value)}
                />
              </div>

              <PermissionGate required={PERM.PRICING_MANAGE}>
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">Container sale (optional)</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`Container price per m² (${baseCurrency})`} error={errors.containerPricePerSqm} hint="Leave empty if not sold by container">
                      <Input className="rounded-none" type="number" min={0} value={form.containerPricePerSqm} onChange={(e) => set("containerPricePerSqm", e.target.value)} />
                    </Field>
                    <Field label="m² in one container" error={errors.sqmPerContainer}>
                      <Input className="rounded-none" type="number" min={0} step="0.01" value={form.sqmPerContainer} onChange={(e) => set("sqmPerContainer", e.target.value)} />
                    </Field>
                  </div>
                </div>
              </PermissionGate>

              {!editId && (
                <PermissionGate required={PERM.INVENTORY_ADJUST}>
                <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                  <Field label="Starting stock (m²)" error={errors.stockSqm}>
                    <Input className="rounded-none" type="number" min={0} step="0.01" value={form.stockSqm} onChange={(e) => set("stockSqm", e.target.value)} />
                  </Field>
                  <Field label="Low stock alert at (m²)" error={errors.reorderLevel}>
                    <Input className="rounded-none" type="number" min={0} step="0.01" value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} />
                  </Field>
                </div>
                </PermissionGate>
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
    </PermissionGate>
  );
}