"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, type Product, type Category } from "@/lib/api";

const CATEGORY_FILTERS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "floor", label: "Floor" },
  { key: "wall", label: "Wall" },
  { key: "outdoor", label: "Outdoor" },
  { key: "special", label: "Special Finish" },
];

const BADGE_FILTERS = ["All", "Bestseller", "New", "Premium"] as const;

type ViewMode = "grid" | "list";
type SortKey = "name" | "category" | "newest";

function badgeStyle(badge: Product["badge"]) {
  if (badge === "New") return "bg-emerald-500 ";
  if (badge === "Premium") return "bg-accent ";
  if (badge === "Bestseller") return "bg-primary ";
  return "";
}

export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [badgeFilter, setBadgeFilter] = useState("All");
  const [sort, setSort] = useState<SortKey>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    setMounted(true);
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (badgeFilter !== "All") list = list.filter((p) => p.badge === badgeFilter);
    if (search.trim()) list = list.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.collection.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "category") list.sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));
    if (sort === "newest") list.sort((a, b) => b.id - a.id);
    return list;
  }, [products, category, badgeFilter, search, sort]);

  const featured = products.filter((p) => p.featured);

  if (!mounted) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className=" text-sm animate-pulse">Loading catalogue…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div className="bg-accent pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
                <span className="w-8 h-px bg-primary" />
                Mountain Ceramics Company
              </span>
              <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
                Tile Catalogue
              </h1>
              <p className=" text-base mt-3 max-w-lg">
                Browse our full range of floor, wall, outdoor and specialty tiles.
                Click any tile to visualize it in your space.
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link href="/" className="  text-sm transition-colors">
                ← Back to home
              </Link>
              <Link
                href="/visualizer"
                className="bg-primary hover:bg-primary  text-sm font-bold px-6 py-3 uppercase tracking-widest transition-colors"
              >
                Open Visualizer
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-10 pt-10 -t /10">
            {CATEGORY_FILTERS.filter((f) => f.key !== "all").map((f) => {
              const count = products.filter((p) => p.category === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setCategory(f.key)}
                  className={`text-left transition-all ${category === f.key ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
                >
                  <p className="text-2xl font-bold ">{count}</p>
                  <p className=" text-xs font-semibold uppercase tracking-widest mt-0.5">{f.label}</p>
                </button>
              );
            })}
            <div className="text-left">
              <p className="text-2xl font-bold ">{products.length}</p>
              <p className=" text-xs font-semibold uppercase tracking-widest mt-0.5">Total</p>
            </div>
          </div>
        </div>
      </div>

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
        <div className="   shadow-sm p-4 mb-8 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-2.5 w-4 h-4 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, description, collection…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm  -gray-200 focus:outline-none focus:-primary bg-muted"
            />
          </div>

          {/* Category */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setCategory(f.key)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${category === f.key ? "bg-accent " : "  hover:"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Badge filter */}
          <div className="flex gap-1.5">
            {BADGE_FILTERS.map((b) => (
              <button
                key={b}
                onClick={() => setBadgeFilter(b)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${badgeFilter === b ? "bg-primary " : "  hover:"
                  }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs font-semibold  -gray-200 px-3 py-2  focus:outline-none focus:-primary "
          >
            <option value="name">Sort: Name A–Z</option>
            <option value="category">Sort: Category</option>
            <option value="newest">Sort: Newest First</option>
          </select>

          {/* View mode */}
          <div className="flex  -gray-200 overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-accent " : "  hover:text-foreground"}`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-accent " : "  hover:text-foreground"}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm ">
            Showing <span className="font-bold ">{filtered.length}</span> of {products.length} tiles
            {search && <span> matching "<span className=" font-semibold">{search}</span>"</span>}
          </p>
          {(search || category !== "all" || badgeFilter !== "All") && (
            <button
              onClick={() => { setSearch(""); setCategory("all"); setBadgeFilter("All"); }}
              className="text-xs  hover:text-red-500 font-semibold transition-colors"
            >
              Clear filters ×
            </button>
          )}
        </div>

        {/* ── Product grid ─────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl  flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-ivory/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>
            <p className=" font-semibold">No tiles found</p>
            <p className=" text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => <GridCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => <ListCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Bottom CTA */}
        {filtered.length > 0 && (
          <div className="mt-16 bg-accent p-10 text-center">
            <h3 className=" font-bold text-2xl mb-2">Ready to place an order?</h3>
            <p className=" text-sm mb-6">Contact our team for pricing, samples, and custom orders.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/#contact"
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
      </div>
    </div>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────

function FeaturedCard({ product: p }: { product: Product }) {
  const surface = p.category === "wall" || p.category === "special" ? "wall" : "floor";
  return (
    <div className="group block overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-surface rounded-lg border border-stone-800">
      <div className="relative h-48 overflow-hidden">
        {p.image && (
          <Image
            src={p.image}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 50vw, 25vw"
            unoptimized
          />
        )}
        {/* Hover overlay with dual actions */}
        <div className="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-3">
          <Link
            href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider rounded shadow flex items-center gap-1.5 transition-transform hover:scale-105"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Visualize</span>
          </Link>
          <Link
            href={`/tiles/${p.id}`}
            className="bg-surface/90 hover:bg-surface text-ivory/80 text-xs font-medium px-3 py-1 uppercase tracking-wider rounded border border-stone-700 transition-colors"
          >
            View Details
          </Link>
        </div>
        <span className="absolute top-3 left-0 bg-primary text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest">
          Featured
        </span>
        {p.badge && (
          <span className={`absolute top-3 right-3 text-[9px] font-bold px-2.5 py-1 uppercase tracking-wider ${badgeStyle(p.badge)}`}>
            {p.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1 text-primary">{p.categoryLabel}</p>
        <Link href={`/tiles/${p.id}`}>
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
    <div className="group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block bg-surface rounded-lg border border-stone-800">
      <div className="relative h-52 overflow-hidden">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted flex items-center justify-center">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18V6z" />
            </svg>
          </div>
        )}
        {/* Hover overlay with dual actions */}
        <div className="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-3">
          <Link
            href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider rounded shadow flex items-center gap-1.5 transition-transform hover:scale-105"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Visualize in Room</span>
          </Link>
          <Link
            href={`/tiles/${p.id}`}
            className="bg-surface/90 hover:bg-surface text-ivory/80 text-xs font-medium px-3 py-1 uppercase tracking-wider rounded border border-stone-700 transition-colors"
          >
            View Details
          </Link>
        </div>
        {p.badge && (
          <span className={`absolute top-3 left-0 text-[9px] font-bold px-3 py-1 uppercase tracking-wider ${badgeStyle(p.badge)}`}>
            {p.badge}
          </span>
        )}
      </div>
      <div className="p-5 border-t border-stone-800">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5 text-primary">{p.categoryLabel}</p>
        <Link href={`/tiles/${p.id}`}>
          <h3 className="font-bold text-base mb-1 text-foreground hover:text-primary transition-colors">{p.name}</h3>
        </Link>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">{p.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-stone-800/80">
          <span className="text-xs text-muted-foreground">{p.sizes}</span>
          <div className="flex items-center gap-2">
            <Link
              href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
              className="text-primary hover:underline text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
            >
              Visualize
            </Link>
            <span className="text-stone-600">·</span>
            <Link
              href={`/tiles/${p.id}`}
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
    <div className="shadow-sm hover:shadow-md transition-all group flex gap-4 p-4 bg-surface rounded-lg border border-stone-800">
      <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="96px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted" />
        )}
        {p.badge && (
          <span className={`absolute top-0 left-0 text-[8px] font-bold px-2 py-0.5 ${badgeStyle(p.badge)}`}>
            {p.badge}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5 text-primary">{p.categoryLabel}</p>
            <Link href={`/tiles/${p.id}`}>
              <h3 className="font-bold text-base truncate text-foreground hover:text-primary transition-colors">{p.name}</h3>
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/visualizer?tile=${p.id}&autoApply=1&surface=${surface}`}
              className="border border-primary/40 hover:bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider flex items-center gap-1 rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Visualize</span>
            </Link>
            <Link
              href={`/tiles/${p.id}`}
              className="bg-primary hover:bg-primary/90 text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded transition-colors"
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
              <span key={i} title={c} className="w-3 h-3 rounded-full border border-stone-700" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
