"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type Product, type Collection } from "@/lib/api";

function badgeStyle(badge: Product["badge"]) {
  if (badge === "New")        return "bg-emerald-500 text-white";
  if (badge === "Premium")    return "bg-[#0f1117] text-[#c9a84c]";
  if (badge === "Bestseller") return "bg-[#c9a84c] text-white";
  return "";
}

export default function TileDetailPage() {
  const params  = useParams();
  const id      = Number(params.id);

  const [tile,        setTile]        = useState<Product | null>(null);
  const [collection,  setCollection]  = useState<Collection | null>(null);
  const [related,     setRelated]     = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getProducts(), api.getCollections()])
      .then(([products, collections]) => {
        const found = products.find((p) => p.id === id) ?? null;
        setTile(found);
        setAllProducts(products);

        if (found) {
          // Find collection this tile belongs to
          const col = collections.find((c) => c.tileIds.includes(found.id)) ?? null;
          setCollection(col);

          // Related tiles: same category, excluding this tile
          const rel = products
            .filter((p) => p.id !== found.id && p.category === found.category)
            .slice(0, 4);
          setRelated(rel);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading tile…</div>
      </div>
    );
  }

  if (!tile) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-semibold text-lg">Tile not found</p>
          <Link href="/catalogue" className="text-[#c9a84c] hover:underline text-sm mt-2 inline-block">
            ← Back to catalogue
          </Link>
        </div>
      </div>
    );
  }

  const isLocal = tile.image.startsWith("/uploads/") || tile.image.startsWith("data:");

  // Tiles in the same collection (excluding this tile)
  const collectionTiles = collection
    ? allProducts.filter((p) => p.id !== tile.id && collection.tileIds.includes(p.id)).slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* ── Top nav bar ─────────────────────────────────────────────── */}
      <nav className="bg-[#0f1117] px-6 py-4 flex items-center gap-4 text-sm">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
        <span className="text-gray-600">/</span>
        <Link href="/catalogue" className="text-gray-400 hover:text-white transition-colors">Catalogue</Link>
        <span className="text-gray-600">/</span>
        <span className="text-white font-medium truncate">{tile.name}</span>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* ── LEFT — tile image ──────────────────────────────────── */}
          <div>
            <div className="relative aspect-square bg-white shadow-lg overflow-hidden">
              {tile.image ? (
                <Image
                  src={tile.image}
                  alt={tile.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  unoptimized={isLocal}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18V6z"/>
                  </svg>
                </div>
              )}
              {tile.badge && (
                <span className={`absolute top-4 left-0 text-xs font-bold px-4 py-1.5 tracking-wider uppercase ${badgeStyle(tile.badge)}`}>
                  {tile.badge}
                </span>
              )}
            </div>

            {/* Color swatches */}
            {tile.colors.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Colors</span>
                <div className="flex gap-2">
                  {tile.colors.map((c, i) => (
                    <span
                      key={i}
                      title={c}
                      className="w-6 h-6 rounded-full border-2 border-white shadow cursor-pointer hover:scale-110 transition-transform"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — tile info ──────────────────────────────────── */}
          <div className="space-y-6">

            {/* Category + name */}
            <div>
              <span className="text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase block mb-2">
                {tile.categoryLabel}
              </span>
              <h1 className="font-playfair text-4xl font-bold text-[#0f1117] leading-tight">
                {tile.name}
              </h1>
            </div>

            {/* Description */}
            {tile.description && (
              <p className="text-gray-600 text-base leading-relaxed">{tile.description}</p>
            )}

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-4">
              {tile.sizes && (
                <div className="bg-white p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sizes</p>
                  <p className="text-sm font-semibold text-[#0f1117]">{tile.sizes}</p>
                </div>
              )}
              {tile.useCase && (
                <div className="bg-white p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Use Case</p>
                  <p className="text-sm font-semibold text-[#0f1117]">{tile.useCase}</p>
                </div>
              )}
              <div className="bg-white p-4 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm font-semibold text-[#0f1117]">{tile.categoryLabel}</p>
              </div>
              {tile.featured && (
                <div className="bg-[#c9a84c]/10 p-4 border border-[#c9a84c]/20">
                  <p className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-semibold text-[#a07830]">⭐ Featured</p>
                </div>
              )}
            </div>

            {/* ── Collection card ──────────────────────────────────── */}
            {collection ? (
              <div className="bg-[#0f1117] p-5">
                <p className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-widest mb-3">Part of Collection</p>
                <Link
                  href={`/collections#col-${collection.id}`}
                  className="flex items-center gap-4 group"
                >
                  {/* Collection thumbnail */}
                  <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden bg-gray-800">
                    {collection.image ? (
                      <Image
                        src={collection.image}
                        alt={collection.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="64px"
                        unoptimized={collection.image.startsWith("/uploads/") || collection.image.startsWith("data:")}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-base group-hover:text-[#c9a84c] transition-colors">
                      {collection.name}
                    </p>
                    {collection.description && (
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{collection.description}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {collection.tileIds.length} tile{collection.tileIds.length !== 1 ? "s" : ""} in this collection
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-[#c9a84c] flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>

                {/* Other tiles in the collection */}
                {collectionTiles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                      Also in this collection
                    </p>
                    <div className="flex gap-2">
                      {collectionTiles.map((t) => (
                        <Link
                          key={t.id}
                          href={`/tiles/${t.id}`}
                          title={t.name}
                          className="relative w-12 h-12 flex-shrink-0 overflow-hidden bg-gray-700 hover:ring-2 hover:ring-[#c9a84c] transition-all"
                        >
                          {t.image ? (
                            <Image
                              src={t.image}
                              alt={t.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized={t.image.startsWith("/uploads/") || t.image.startsWith("data:")}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-700" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 p-4 border border-gray-200">
                <p className="text-xs text-gray-400">This tile is not part of a named collection.</p>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/visualizer?tile=${tile.id}&autoApply=1&surface=${tile.category === "wall" || tile.category === "special" ? "wall" : "floor"}`}
                className="flex-1 bg-[#c9a84c] hover:bg-[#b8943e] text-white font-bold py-4 px-6 text-sm tracking-widest uppercase text-center transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                Visualize in Room
              </Link>
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); window.location.href = "/#contact"; }}
                className="flex-1 bg-[#0f1117] hover:bg-gray-800 text-white font-bold py-4 px-6 text-sm tracking-widest uppercase text-center transition-colors"
              >
                Get a Quote
              </a>
            </div>
          </div>
        </div>

        {/* ── Related tiles ──────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-20 pt-14 border-t border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-playfair text-2xl font-bold text-[#0f1117]">
                More {tile.categoryLabel}
              </h2>
              <Link href={`/catalogue?category=${tile.category}`} className="text-[#c9a84c] text-sm font-semibold hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((r) => {
                const rIsLocal = r.image.startsWith("/uploads/") || r.image.startsWith("data:");
                return (
                  <Link
                    key={r.id}
                    href={`/tiles/${r.id}`}
                    className="bg-white group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-44 overflow-hidden bg-gray-100">
                      {r.image ? (
                        <Image
                          src={r.image}
                          alt={r.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, 25vw"
                          unoptimized={rIsLocal}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg>
                        </div>
                      )}
                      {r.badge && (
                        <span className={`absolute top-2 left-0 text-[9px] font-bold px-2.5 py-0.5 ${badgeStyle(r.badge)}`}>{r.badge}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[#c9a84c] text-[9px] font-bold uppercase tracking-widest mb-0.5">{r.categoryLabel}</p>
                      <p className="font-bold text-[#0f1117] text-sm group-hover:text-[#c9a84c] transition-colors">{r.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{r.sizes}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
