import { Button } from "@/components/ui/button";
import { Link } from "@/app/i18n/routing";

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
  search?: string;
};

function updateQuery(
  current: Omit<CatalogueControlsProps, "search"> & { search?: string },
  key: string,
  value: string,
  defaultValue?: string,
) {
  const query = new URLSearchParams();
  for (const [name, currentValue] of Object.entries(current)) {
    if (currentValue && currentValue !== "all" && currentValue !== "All" && currentValue !== "newest" && currentValue !== "grid") {
      query.set(name, currentValue);
    }
  }
  if (!value || value === defaultValue) query.delete(key);
  else query.set(key, value);
  query.delete("page");
  const search = query.toString();
  return `/catalogue${search ? `?${search}` : ""}`;
}

export function CatalogueControls({
  category,
  badgeFilter,
  sort,
  viewMode,
  search = "",
}: CatalogueControlsProps) {
  const current = { category, badgeFilter, sort, viewMode, search };
  return (
    <div className="mb-8 flex flex-col items-start gap-4 border border-border bg-card p-4 shadow-sm">
      <div className="flex w-full flex-wrap gap-1.5" aria-label="Filter by category">
        {categories.map(([value, label]) => (
          <Button
            asChild
            key={value}
            variant={category === value ? "secondary" : "outline"}
            aria-pressed={category === value}
            className="text-xs font-bold uppercase tracking-wider"
          >
            <Link href={updateQuery(current, "category", value, "all")}>{label}</Link>
          </Button>
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Label:</span>
        {badges.map((value) => (
          <Button
            asChild
            key={value}
            variant={badgeFilter === value ? "secondary" : "outline"}
            aria-pressed={badgeFilter === value}
            className="text-xs font-bold uppercase tracking-wider"
          >
            <Link href={updateQuery(current, "badgeFilter", value, "All")}>{value}</Link>
          </Button>
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground">
          Sort products
        </span>
        <div className="flex flex-wrap gap-1.5" aria-label="Sort products">
          {([
            ["newest", "Newest first"],
            ["name", "Name A–Z"],
            ["category", "Category"],
          ] as const).map(([value, label]) => (
            <Button key={value} asChild variant={sort === value ? "secondary" : "outline"} size="sm">
              <Link href={updateQuery(current, "sort", value, "newest")}>{label}</Link>
            </Button>
          ))}
        </div>

        <div className="ml-auto flex border border-border" aria-label="Product view">
          <Button
            asChild
            type="button"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
          >
            <Link href={updateQuery(current, "viewMode", "grid", "grid")} aria-label="Grid view">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </Link>
          </Button>
          <Button
            asChild
            type="button"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
          >
            <Link href={updateQuery(current, "viewMode", "list")} aria-label="List view">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
