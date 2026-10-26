"use client";

import { MediaImage } from "@/components/media-image";

import type { Product } from "@/lib/api";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function TilePicker({
  label,
  products,
  selected,
  onToggle,
}: {
  label: string;
  products: Product[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-3">
        {products.map((p) => {
          const on = selected.includes(p.id);
          return (
            <label
              key={p.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all ${on ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
                }`}
            >
              <Input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(p.id)}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              {p.image && (                <MediaImage src={p.image} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.categoryLabel}</p>
              </div>
            </label>
          );
        })}
        {products.length === 0 && (
          <p className="col-span-full p-2 text-xs text-muted-foreground">Add tiles first.</p>
        )}
      </div>
      {selected.length > 0 && (
        <p className="mt-2 text-xs font-semibold text-primary">{selected.length} selected</p>
      )}
    </div>
  );
}