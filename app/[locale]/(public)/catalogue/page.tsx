
import Image from "next/image";
import Link from "next/link";
import { type CatalogueDoc, type Product, serverApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { CatalogueControls } from "@/components/catalogue-controls";
import { PublicCatalogueDocuments } from "@/components/public-catalogue-documents";

const BADGE_FILTERS = ["All", "Bestseller", "New", "Premium"] as const;

type ViewMode = "grid" | "list";
type SortKey = "name" | "category" | "newest";

function badgeStyle(badge: Product["badge"]) {
  if (badge === "New") return "bg-success text-success-foreground";
  if (badge === "Premium") return "bg-accent ";
  if (badge === "Bestseller") return "bg-primary ";
  return "";
}

const PAGE_SIZE = 12
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
    viewMode?: ViewMode;
    sort?: SortKey;
    badgeFilter?: string;
  }>;
}) {
  let totalPages = 1;
  let downloadableCatalogues: CatalogueDoc[] = [];
  const {
    search,
    badgeFilter: requestedBadgeFilter,
    category: requestedCategory,
    page: pageParam,
    viewMode: requestedViewMode,
    sort: requestedSort,
  } = await searchParams;
  const category = requestedCategory || "all";
  const badgeFilter = BADGE_FILTERS.includes(
    (requestedBadgeFilter || "All") as (typeof BADGE_FILTERS)[number],
  )
    ? requestedBadgeFilter || "All"
    : "All";
  const sort: SortKey = ["name", "category", "newest"].includes(requestedSort ?? "")
    ? (requestedSort as SortKey)
    : "newest";
  const viewMode: ViewMode = requestedViewMode === "list" ? "list" : "grid";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  let products = null;
  let total = 0;
  try {
    const data = await serverApi.getProducts({
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      category: category === "all" ? undefined : category,
      search,
      status: "ACTIVE",
      badge: badgeFilter === "All" ? undefined : badgeFilter,
      sort,
    });
    products = data.products;
    total = data.total;
    totalPages = data.totalPages;
  } catch (error) {
    console.error("Could not load catalogue products:", error);
  }
  try {
    downloadableCatalogues = await serverApi.getCatalogues();
  } catch (error) {
    console.error("Could not load downloadable catalogues:", error);
  }

  if (!products) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <p className=" font-semibold text-lg">Tiles not found</p>
          <Link href="/" className=" hover:underline text-sm mt-2 inline-block">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }



  const featured = products.filter((p: any) => p.featured);



  return (
    <div className="min-h-screen ">

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <section className="bg-inverse py-20 px-6">
        <div className="max-w-7xl mx-auto ">
          <div className="max-w-7xl mx-auto text-center">
            <div>
              <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
                <span className="w-8 h-px bg-primary" />
                Mountain Ceramics Company
                <span className="w-8 h-px bg-primary" />
              </span>
              <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
                Tile Catalogue
              </h1>
              <p className=" text-lg max-w-2xl mx-auto">
                Browse our full range of floor, wall, outdoor and specialty tiles.
                Click any tile to visualize it in your space.
              </p>
            </div>

          </div>

          <div className="mt-10 border-t border-inverse-border pt-6 text-center text-sm text-inverse-foreground/80">
            {total} {total === 1 ? "tile" : "tiles"} match your current filters
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── Featured tiles ──────────────────────────────────────────── */}
        {featured.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-primary" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] ">Featured</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.slice(0, 4).map((p) => (
                <FeaturedCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── Filters & controls ──────────────────────────────────────── */}
        <CatalogueControls
          category={category}
          badgeFilter={badgeFilter}
          sort={sort}
          viewMode={viewMode}
        />

        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm ">
            Showing <span className="font-bold ">{products.length}</span> of {total} tiles
            {search && <span> matching "<span className=" font-semibold">{search}</span>"</span>}
          </p>
          {(search || category !== "all" || badgeFilter !== "All" || sort !== "newest" || viewMode !== "grid") && (
            <Link
              href="/catalogue"
              className="text-xs  hover:text-destructive font-semibold transition-colors"
            >
              Clear filters ×
            </Link>
          )}
        </div>

        {/* ── Product grid ─────────────────────────────────────────────── */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16  -2xl  flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8  " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>
            <p className=" font-semibold">No tiles found</p>
            <p className=" text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => <GridCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => <ListCard key={p.id} product={p} />)}
          </div>
        )}
        <PaginationControls
          page={page}
          totalPages={totalPages}
          basePath="/catalogue"
          prevLabel={"Previous"}
          nextLabel={"Next"}
          pageLabel={`Page of ${page}/${totalPages}`}
          extraQuery={{
            ...(category !== "all" ? { category } : {}),
            ...(badgeFilter !== "All" ? { badgeFilter } : {}),
            ...(search ? { search } : {}),
            ...(sort !== "newest" ? { sort } : {}),
            ...(viewMode !== "grid" ? { viewMode } : {}),
          }}
        />

        {/* Bottom CTA */}
        {products.length > 0 && (
          <div className="mt-16 bg-accent p-10 text-center">
            <h3 className=" font-bold text-2xl mb-2">Ready to place an order?</h3>
            <p className=" text-sm mb-6">Contact our team for pricing, samples, and custom orders.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="bg-primary hover:bg-primary  font-bold px-8 py-3.5 uppercase tracking-widest text-sm transition-colors"
              >
                Request a Quote
              </Link>
              <Link
                href="/visualizer"
                className=" /20 hover:-primary  font-bold px-8 py-3.5 uppercase tracking-widest text-sm transition-colors"
              >
                Try Visualizer
              </Link>
            </div>
          </div>
        )}
        <PublicCatalogueDocuments catalogues={downloadableCatalogues} />
      </div>
    </div>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────

function FeaturedCard({ product: p }: { product: Product }) {
  const surface = p.category === "wall" || p.category === "special" ? "wall" : "floor";
  return (
    <div className="group block overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-background  -lg border  ">
      <div className="relative h-48 overflow-hidden">
        {p.image && (
          <Image
            src={p.image}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 50vw, 25vw"

          />
        )}
        {/* Hover overlay with dual actions */}
        <div className="absolute inset-0 bg-inverse/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-3">
          <Link
            href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
            className="bg-primary hover:bg-primary/90   text-xs font-bold px-3 py-1.5 uppercase tracking-wider   shadow flex items-center gap-1.5 transition-transform hover:scale-105"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Visualize</span>
          </Link>
          <Link
            href={`/products/${p.slug ?? p.id}`}
            className="bg-background/90 hover:bg-background text-foreground text-xs font-medium px-3 py-1 uppercase tracking-wider border border-border transition-colors"
          >
            View Details
          </Link>
        </div>
        <Badge className="absolute left-0 top-3 h-auto rounded-none px-3 py-1 text-[9px] font-bold uppercase tracking-widest">
          Featured
        </Badge>
        {p.badge && (
          <Badge className={`absolute right-3 top-3 h-auto rounded-none px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${badgeStyle(p.badge)}`}>
            {p.badge}
          </Badge>
        )}
      </div>
      <div className="p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1 text-primary">{p.categoryLabel}</p>
        <Link href={`/products/${p.slug ?? p.id}`}>
          <h3 className="font-bold text-sm text-foreground hover:text-primary transition-colors">{p.name}</h3>
        </Link>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>{p.sizes}</span>
          <Link
            href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
            className="text-primary text-[10px] font-bold hover:underline uppercase"
          >
            Try in Room →
          </Link>
        </div>
      </div>
    </div>
  );
}

function GridCard({ product: p }: { product: Product }) {
  const surface = p.category === "wall" || p.category === "special" ? "wall" : "floor";
  return (
    <div className="group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block bg-background  -lg border  ">
      <div className="relative h-52 overflow-hidden">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"

          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-muted to-muted flex items-center justify-center">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18V6z" />
            </svg>
          </div>
        )}
        {/* Hover overlay with dual actions */}
        <div className="absolute inset-0 bg-inverse/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-3">
          <Link
            href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
            className="bg-primary hover:bg-primary/90   text-xs font-bold px-3 py-1.5 uppercase tracking-wider   shadow flex items-center gap-1.5 transition-transform hover:scale-105"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Visualize in Room</span>
          </Link>
          <Link
            href={`/products/${p.slug ?? p.id}`}
            className="bg-background/90 hover:bg-background text-foreground text-xs font-medium px-3 py-1 uppercase tracking-wider border border-border transition-colors"
          >
            View Details
          </Link>
        </div>
        {p.badge && (
          <Badge className={`absolute left-0 top-3 h-auto rounded-none px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${badgeStyle(p.badge)}`}>
            {p.badge}
          </Badge>
        )}
      </div>
      <div className="p-5 border-t  ">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5 text-primary">{p.categoryLabel}</p>
        <Link href={`/products/${p.slug ?? p.id}`}>
          <h3 className="font-bold text-base mb-1 text-foreground hover:text-primary transition-colors">{p.name}</h3>
        </Link>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">{p.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{p.sizes}</span>
          <div className="flex items-center gap-2">
            <Link
              href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
              className="text-primary hover:underline text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
            >
              Visualize
            </Link>
            <span className="text-muted">·</span>
            <Link
              href={`/products/${p.slug ?? p.id}`}
              className="text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-wider"
            >
              Details →
            </Link>
          </div>
        </div>
        {p.collection && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Collection: <span className="font-semibold text-foreground">{p.collection}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function ListCard({ product: p }: { product: Product }) {
  const surface = p.category === "wall" || p.category === "special" ? "wall" : "floor";
  return (
    <div className="shadow-sm hover:shadow-md transition-all group flex gap-4 p-4 bg-background  -lg border  ">
      <div className="relative w-24 h-24 shrink-0 overflow-hidden  ">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="96px"

          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-muted to-muted" />
        )}
        {p.badge && (
          <Badge className={`absolute left-0 top-0 h-auto rounded-none px-2 py-0.5 text-[8px] font-bold ${badgeStyle(p.badge)}`}>
            {p.badge}
          </Badge>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5 text-primary">{p.categoryLabel}</p>
            <Link href={`/products/${p.slug ?? p.id}`}>
              <h3 className="font-bold text-base truncate text-foreground hover:text-primary transition-colors">{p.name}</h3>
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
              className="border border-primary/40 hover:bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider flex items-center gap-1   transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Visualize</span>
            </Link>
            <Link
              href={`/products/${p.slug ?? p.id}`}
              className="bg-primary hover:bg-primary/90   text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest   transition-colors"
            >
              View →
            </Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{p.description}</p>
        <div className="flex items-center gap-4 mt-2.5">
          <span className="text-xs text-muted-foreground">{p.sizes}</span>
          {p.collection && (
            <span className="text-xs text-muted-foreground">
              Collection: <span className="font-medium text-foreground">{p.collection}</span>
            </span>
          )}
          <div className="flex gap-1.5 ml-auto">
            {p.colors.slice(0, 5).map((c, i) => (
              <span key={i} title={c} className="w-3 h-3 rounded-full border border-border" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
