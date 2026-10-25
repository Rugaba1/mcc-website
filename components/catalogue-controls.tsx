"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  ["all", "All"],
  ["floor", "Floor"],
  ["wall", "Wall"],
  ["outdoor", "Outdoor"],
  ["special", "Special Finish"],
] as const;

const badges = ["All", "Bestseller", "New", "Premium"] as const;

type CatalogueControlsProps = {
  category: string;
  badgeFilter: string;
  sort: "name" | "category" | "newest";
  viewMode: "grid" | "list";
};

function updateQuery(key: string, value: string, defaultValue?: string) {
  const query = new URLSearchParams(window.location.search);
  if (!value || value === defaultValue) query.delete(key);
  else query.set(key, value);
  query.delete("page");
  window.location.search = query.toString();
}

export function CatalogueControls({
  category,
  badgeFilter,
  sort,
  viewMode,
}: CatalogueControlsProps) {
  return (
    <div className="mb-8 flex flex-col items-start gap-4 border border-border bg-card p-4 shadow-sm">
      <div className="flex w-full flex-wrap gap-1.5" aria-label="Filter by category">
        {categories.map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={category === value ? "secondary" : "outline"}
            aria-pressed={category === value}
            className="text-xs font-bold uppercase tracking-wider"
            onClick={() => updateQuery("category", value, "all")}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Label:</span>
        {badges.map((value) => (
          <Button
            key={value}
            type="button"
            variant={badgeFilter === value ? "secondary" : "outline"}
            aria-pressed={badgeFilter === value}
            className="text-xs font-bold uppercase tracking-wider"
            onClick={() => updateQuery("badgeFilter", value, "All")}
          >
            {value}
          </Button>
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center gap-3">
        <label htmlFor="catalogue-sort" className="text-xs font-semibold text-muted-foreground">
          Sort products
        </label>
        <Select
          value={sort}
          onValueChange={(value) =>
            updateQuery("sort", value, "newest")
          }
        >
          <SelectTrigger id="catalogue-sort" className="w-full bg-background sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex border border-border" aria-label="Product view">
          <Button
            type="button"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            onClick={() => updateQuery("viewMode", "grid", "grid")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            onClick={() => updateQuery("viewMode", "list")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
