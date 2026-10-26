"use client";

import { MediaImage } from "@/components/media-image";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { api, type Product } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type Picked = { id: number; name: string };

/** Search products and tick the ones to include. Value is a list of {id, name}. */
export function ProductPicker({ value, onChange }: { value: Picked[]; onChange: (v: Picked[]) => void }) {
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query);
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    api.getProducts({ search: q || undefined, skip: 0, limit: 20 })
      .then((r) => !cancelled && setResults(r.products))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setSearching(false));
    return () => { cancelled = true; };
  }, [q]);

  const has = (id: number) => value.some((p) => p.id === id);
  const toggle = (p: Product) => onChange(has(p.id) ? value.filter((x) => x.id !== p.id) : [...value, { id: p.id, name: p.name }]);

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
          {value.map((p) => (
            <Badge key={p.id} variant="secondary" className="gap-1 rounded-none">
              {p.name}
              <button type="button" aria-label={`Remove ${p.name}`} onClick={() => onChange(value.filter((x) => x.id !== p.id))}><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="rounded-none pl-8" placeholder="Search products to add" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="max-h-56 overflow-y-auto border">
        {searching && results.length === 0 ? (
          <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Searching…</p>
        ) : results.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No products found.</p>
        ) : (
          <ul className="divide-y">
            {results.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 p-2.5 hover:bg-accent">
                  <Checkbox className="rounded-none" checked={has(p.id)} onCheckedChange={() => toggle(p)} />
                  <div className="size-9 shrink-0 overflow-hidden bg-muted">
                    {p.image && <MediaImage src={p.image} alt="" className="size-full object-cover" />}
                  </div>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="block truncate text-xs text-muted-foreground">{p.categoryLabel}</span></span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}