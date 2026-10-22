"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  api,
  apiErrorMessage,
  BADGE_OPTIONS,
  CATEGORY_OPTIONS,
  type Badge as ProductBadge,
  type Category,
  type Product,
  type ProductStatus,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ImageField } from "../file-picker";
import { ColorsField } from "../color-field";

const STATUS_OPTIONS: { value: ProductStatus; label: string; hint: string }[] = [
  { value: "ACTIVE", label: "Active", hint: "Visible on the public catalog" },
  { value: "DRAFT", label: "Draft", hint: "Hidden while you finish setting it up" },
  { value: "ARCHIVED", label: "Archived", hint: "Hidden, kept for old orders" },
];

type FormState = {
  name: string;
  category: Category | "";
  status: ProductStatus;
  collection: string;
  useCase: string;
  sizes: string;
  colors: string[];
  badge: string; // "none" | Bestseller | New | Premium
  image: string;
  gradient: string;
  description: string;
  featured: boolean;

  // tile specs shared by all variants
  material: string;
  origin: string;
  slipRating: string;
  waterAbsorption: string;
  isRectified: boolean;

  // SEO
  seoTitle: string;
  seoDescription: string;
};

const EMPTY: FormState = {
  name: "",
  category: "",
  status: "ACTIVE",
  collection: "",
  useCase: "",
  sizes: "",
  colors: [],
  badge: "none",
  image: "",
  gradient: "",
  description: "",
  featured: false,
  material: "",
  origin: "",
  slipRating: "",
  waterAbsorption: "",
  isRectified: false,
  seoTitle: "",
  seoDescription: "",
};

// Accepts string[] or a comma-separated string (the DB column is plain text)
const toList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String).filter(Boolean)
    : typeof v === "string"
      ? v.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

const orNull = (s: string) => s.trim() || null;

const fromProduct = (p: Product): FormState => ({
  name: p.name ?? "",
  category: p.category ?? "",
  status: (p.status as ProductStatus) ?? "ACTIVE",
  collection: p.collection ?? "",
  useCase: p.useCase ?? "",
  sizes: p.sizes ?? "",
  colors: toList(p.colors),
  badge: p.badge ?? "none",
  image: p.image ?? "",
  gradient: p.gradient ?? "",
  description: p.description ?? "",
  featured: !!p.featured,
  material: p.material ?? "",
  origin: p.origin ?? "",
  slipRating: p.slipRating ?? "",
  waterAbsorption: p.waterAbsorption ?? "",
  isRectified: !!p.isRectified,
  seoTitle: p.seoTitle ?? "",
  seoDescription: p.seoDescription ?? "",
});

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t pt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function ProductSheet({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(product ? fromProduct(product) : EMPTY);
      setErrors({});
    }
  }, [open, product]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Enter a product name";
    if (!form.category) next.category = "Choose a category";
    if (!form.image.trim()) next.image = "Add an image";
    if (!form.description.trim()) next.description = "Add a short description";
    if (form.seoTitle.length > 255) next.seoTitle = "Max 255 characters";
    if (form.seoDescription.length > 500) next.seoDescription = "Max 500 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    const category = form.category as Category;
    const payload: Omit<Product, "id"> = {
      name: form.name.trim(),
      slug: product?.slug,
      category,
      categoryLabel: CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? category,
      status: form.status,
      description: form.description.trim(),
      sizes: form.sizes.trim(),
      badge: form.badge === "none" ? null : (form.badge as ProductBadge),
      gradient: form.gradient.trim(),
      image: form.image.trim(),
      colors: form.colors,
      useCase: form.useCase.trim(),
      collection: form.collection.trim(),
      featured: form.featured,
      material: orNull(form.material),
      origin: orNull(form.origin),
      slipRating: orNull(form.slipRating),
      waterAbsorption: orNull(form.waterAbsorption),
      isRectified: form.isRectified,
      seoTitle: orNull(form.seoTitle),
      seoDescription: orNull(form.seoDescription),
    };

    setSaving(true);
    try {
      if (product) await api.updateProduct(product.id, payload);
      else await api.createProduct(payload);
      toast.success(product ? "Product updated" : "Product created");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save the product"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 rounded-none p-0 sm:max-w-xl">
        <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b">
            <SheetTitle>{product ? "Edit product" : "New product"}</SheetTitle>
            <SheetDescription>
              {product
                ? "Changes appear on the public site straight away."
                : "Add a tile design. Add sizes and prices (per m²) afterwards as variants."}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            <Field label="Name" error={errors.name}>
              <Input className="rounded-none" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Carrara Marble Look" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" error={errors.category}>
                <Select value={form.category || undefined} onValueChange={(v) => set("category", v as Category)}>
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="rounded-none">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status" hint={STATUS_OPTIONS.find((s) => s.value === form.status)?.hint}>
                <Select value={form.status} onValueChange={(v) => set("status", v as ProductStatus)}>
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="rounded-none">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Badge">
                <Select value={form.badge} onValueChange={(v) => set("badge", v)}>
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {BADGE_OPTIONS.map((b) => (
                      <SelectItem key={b.label} value={b.value ?? "none"} className="rounded-none">
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Collection">
                <Input className="rounded-none" value={form.collection} onChange={(e) => set("collection", e.target.value)} placeholder="Marble Series" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Use case" hint="floor, wall, outdoor, bathroom…">
                <Input className="rounded-none" value={form.useCase} onChange={(e) => set("useCase", e.target.value)} placeholder="floor" />
              </Field>
              <Field label="Sizes (display text)" hint="Only a fallback. The table shows sizes from the variants.">
                <Input className="rounded-none" value={form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="60x60, 30x60" />
              </Field>
            </div>

            <Field label="Colors">
              <ColorsField value={form.colors} onChange={(v) => set("colors", v)} />
            </Field>

            <Field label="Image" error={errors.image}>
              <ImageField value={form.image} kind="image" onChange={(value) => set("image", value)} />
              {form.image.trim() && (
                <div className="mt-2 size-24 overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="Preview" className="size-full object-cover" />
                </div>
              )}
            </Field>

            <Field label="Fallback gradient" hint="CSS gradient used while the image loads (optional)">
              <Input className="rounded-none" value={form.gradient} onChange={(e) => set("gradient", e.target.value)} placeholder="linear-gradient(135deg, #e5e5e5, #cfcfcf)" />
            </Field>

            <Field label="Description" error={errors.description}>
              <Textarea className="min-h-28 rounded-none" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox className="rounded-none" checked={form.featured} onCheckedChange={(c) => set("featured", c === true)} />
              Feature this product on the home page
            </label>

            <Section title="Tile specs (shared by all variants)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Material">
                  <Input className="rounded-none" value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="Porcelain" />
                </Field>
                <Field label="Origin">
                  <Input className="rounded-none" value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Italy" />
                </Field>
                <Field label="Slip rating" hint="R9, R10, R11…">
                  <Input className="rounded-none" value={form.slipRating} onChange={(e) => set("slipRating", e.target.value)} placeholder="R10" />
                </Field>
                <Field label="Water absorption">
                  <Input className="rounded-none" value={form.waterAbsorption} onChange={(e) => set("waterAbsorption", e.target.value)} placeholder="< 0.5%" />
                </Field>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox className="rounded-none" checked={form.isRectified} onCheckedChange={(c) => set("isRectified", c === true)} />
                Rectified edges
              </label>
            </Section>

            <Section title="SEO (optional)">
              <Field label="SEO title" error={errors.seoTitle} hint={`${form.seoTitle.length}/255`}>
                <Input className="rounded-none" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
              </Field>
              <Field label="SEO description" error={errors.seoDescription} hint={`${form.seoDescription.length}/500`}>
                <Textarea className="min-h-20 rounded-none" value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
              </Field>
            </Section>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t">
            <Button type="button" variant="outline" className="rounded-none" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-none" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {product ? "Save changes" : "Create product"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}