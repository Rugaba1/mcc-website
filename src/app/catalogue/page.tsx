"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, type Product, type Category } from "@/lib/api";

const CATEGORY_FILTERS: { key: "all" | Category; label: string }[] = [
  { key: "all",     label: "All" },
  { key: "floor",   label: "Floor" },
  { key: "wall",    label: "Wall" },
  { key: "outdoor", label: "Outdoor" },
  { key: "special", label: "Special Finish" },
];

const BADGE_FILTERS = ["All", "Bestseller", "New", "Premium"] as const;

type ViewMode = "grid" | "list";
type SortKey  = "name" | "category" | "newest";

function badgeStyle(badge: Product["badge"]) {
  if (badge === "New")       return "bg-emerald-500 text-white";
  if (badge === "Premium")   return "bg-[#0f1117] text-[#c9a84c]";
  if (badge === "Bestseller")return "bg-[#c9a84c] text-white";
  return "";
}

export default function CataloguePage() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [mounted,    setMounted]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState<"all" | Category>("all");
  const [badgeFilter,setBadgeFilter]= useState("All");
  const [sort,       setSort]       = useState<SortKey>("name");
  const [viewMode,   setViewMode]   = useState<ViewMode>("grid");

  useEffect(() => {
    setMounted(true);
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all")    list = list.filter((p) => p.category === category);
    if (badgeFilter !== "All") list = list.filter((p) => p.badge === badgeFilter);
    if (search.trim())         list = list.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.collection.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === "name")     list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "category") list.sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));
    if (sort === "newest")   list.sort((a, b) => b.id - a.id);
    return list;
  }, [products, category, badgeFilter, search, sort]);

  const featured = products.filter((p) => p.featured);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading catalogue…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div className="bg-[#0f1117] pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-4">
                <span className="w-8 h-px bg-[#c9a84c]" />
                Mountain Ceramics Company
              </span>
              <h1 className="font-bold text-4xl md:text-5xl text-white leading-tight">
                Tile Catalogue
              </h1>
              <p className="text-gray-400 text-base mt-3 max-w-lg">
                Browse our full range of floor, wall, outdoor and specialty tiles.
                Click any tile to visualize it in your space.
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                ← Back to home
              </Link>
              <Link
                href="/visualizer"
                className="bg-[#c9a84c] hover:bg-[#b8943e] text-white text-sm font-bold px-6 py-3 uppercase tracking-widest transition-colors"
              >
                Open Visualizer
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-10 pt-10 border-t border-white/10">
            {CATEGORY_FILTERS.filter((f) => f.key !== "all").map((f) => {
              const count = products.filter((p) => p.category === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setCategory(f.key)}
                  className={`text-left transition-all ${category === f.key ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
                >
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mt-0.5">{f.label}</p>
                </button>
              );
            })}
            <div className="text-left">
              <p className="text-2xl font-bold text-white">{products.length}</p>
              <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mt-0.5">Total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── Featured tiles ──────────────────────────────────────────── */}
        {featured.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[#c9a84c]" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#c9a84c]">Featured</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.slice(0, 4).map((p) => (
                <FeaturedCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── Filters & controls ──────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 shadow-sm p-4 mb-8 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, description, collection…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#c9a84c] bg-gray-50"
            />
          </div>

          {/* Category */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setCategory(f.key)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  category === f.key ? "bg-[#0f1117] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  badgeFilter === b ? "bg-[#c9a84c] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
            className="text-xs font-semibold border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:border-[#c9a84c] text-gray-600"
          >
            <option value="name">Sort: Name A–Z</option>
            <option value="category">Sort: Category</option>
            <option value="newest">Sort: Newest First</option>
          </select>

          {/* View mode */}
          <div className="flex border border-gray-200 overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-[#0f1117] text-white" : "bg-white text-gray-400 hover:text-gray-700"}`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-[#0f1117] text-white" : "bg-white text-gray-400 hover:text-gray-700"}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold text-[#0f1117]">{filtered.length}</span> of {products.length} tiles
            {search && <span> matching "<span className="text-[#c9a84c] font-semibold">{search}</span>"</span>}
          </p>
          {(search || category !== "all" || badgeFilter !== "All") && (
            <button
              onClick={() => { setSearch(""); setCategory("all"); setBadgeFilter("All"); }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors"
            >
              Clear filters ×
            </button>
          )}
        </div>

        {/* ── Product grid ─────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
            </div>
            <p className="text-gray-500 font-semibold">No tiles found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
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
          <div className="mt-16 bg-[#0f1117] p-10 text-center">
            <h3 className="text-white font-bold text-2xl mb-2">Ready to place an order?</h3>
            <p className="text-gray-400 text-sm mb-6">Contact our team for pricing, samples, and custom orders.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/#contact"
                className="bg-[#c9a84c] hover:bg-[#b8943e] text-white font-bold px-8 py-3.5 uppercase tracking-widest text-sm transition-colors"
              >
                Request a Quote
              </Link>
              <Link
                href="/visualizer"
                className="border border-white/20 hover:border-[#c9a84c] text-white font-bold px-8 py-3.5 uppercase tracking-widest text-sm transition-colors"
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
  return (
    <Link href={`/tiles/${p.id}`} className="group block bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {p.image && (
          <Image unoptimized={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-600"
            sizes="(max-width:640px) 50vw, 25vw"
            unoptimized={p.image.startsWith("data:") || p.image.startsWith("/uploads/")} />
        )}
        <div className="absolute inset-0 bg-[#0f1117]/0 group-hover:bg-[#0f1117]/40 transition-all duration-400 flex items-end p-4">
          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold uppercase tracking-widest transition-opacity duration-300">
            View Details →
          </span>
        </div>
        <span className="absolute top-3 left-0 bg-[#c9a84c] text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest">Featured</span>
        {p.badge && (
          <span className={`absolute top-3 right-3 text-[9px] font-bold px-2.5 py-1 uppercase tracking-wider ${badgeStyle(p.badge)}`}>{p.badge}</span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[#c9a84c] text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{p.categoryLabel}</p>
        <h3 className="font-bold text-[#0f1117] text-sm group-hover:text-[#c9a84c] transition-colors">{p.name}</h3>
        <p className="text-gray-400 text-xs mt-0.5">{p.sizes}</p>
      </div>
    </Link>
  );
}

function GridCard({ product: p }: { product: Product }) {
  return (
    <Link href={`/tiles/${p.id}`} className="bg-white group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400 block">
      <div className="relative h-52 overflow-hidden bg-gray-100">
        {p.image ? (
          <Image unoptimized={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-600"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            unoptimized={p.image.startsWith("data:") || p.image.startsWith("/uploads/")} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18V6z"/>
            </svg>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#0f1117]/0 group-hover:bg-[#0f1117]/50 transition-all duration-400 flex items-center justify-center gap-3">
          <span className="opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-[#c9a84c] text-white text-[10px] font-bold px-4 py-2 uppercase tracking-widest">
            View Details
          </span>
        </div>
        {p.badge && (
          <span className={`absolute top-3 left-0 text-[9px] font-bold px-3 py-1 uppercase tracking-wider ${badgeStyle(p.badge)}`}>{p.badge}</span>
        )}
      </div>
      <div className="p-5 border-t border-gray-100">
        <p className="text-[#c9a84c] text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">{p.categoryLabel}</p>
        <h3 className="font-bold text-[#0f1117] text-base mb-1 group-hover:text-[#c9a84c] transition-colors">{p.name}</h3>
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-4">{p.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-gray-400 text-xs">{p.sizes}</span>
          <div className="flex items-center gap-2">
            {p.colors.slice(0, 4).map((c, i) => (
              <span key={i} title={c} className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: c }} />
            ))}
          </div>
        </div>
        {p.collection && (
          <p className="text-gray-400 text-[10px] mt-2">Collection: <span className="text-gray-600 font-semibold">{p.collection}</span></p>
        )}
      </div>
    </Link>
  );
}

function ListCard({ product: p }: { product: Product }) {
  return (
    <Link href={`/tiles/${p.id}`} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group flex gap-4 p-4 block">
      <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-100">
        {p.image ? (
          <Image unoptimized={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="96px"
            unoptimized={p.image.startsWith("data:") || p.image.startsWith("/uploads/")} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
        {p.badge && (
          <span className={`absolute top-0 left-0 text-[8px] font-bold px-2 py-0.5 ${badgeStyle(p.badge)}`}>{p.badge}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[#c9a84c] text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">{p.categoryLabel}</p>
            <h3 className="font-bold text-[#0f1117] text-base truncate group-hover:text-[#c9a84c] transition-colors">{p.name}</h3>
          </div>
          <span className="bg-[#c9a84c] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest flex-shrink-0">
            View →
          </span>
        </div>
        <p className="text-gray-400 text-xs mt-1.5 line-clamp-1">{p.description}</p>
        <div className="flex items-center gap-4 mt-2.5">
          <span className="text-gray-400 text-xs">{p.sizes}</span>
          {p.collection && <span className="text-gray-400 text-xs">Collection: <span className="text-gray-600 font-medium">{p.collection}</span></span>}
          <div className="flex gap-1.5 ml-auto">
            {p.colors.slice(0, 5).map((c, i) => (
              <span key={i} title={c} className="w-3 h-3 rounded-full border border-gray-200" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
