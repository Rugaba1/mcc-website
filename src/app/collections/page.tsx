"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, type Collection, type Product } from "@/lib/api";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);
    api.getCollections().then(setCollections).catch(console.error);
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <div className="text-white/50 text-sm animate-pulse">Loading collections…</div>
      </div>
    );
  }

  const featuredCollections  = collections.filter((c) => c.featured);
  const regularCollections   = collections.filter((c) => !c.featured);

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="bg-[#0a0c12] h-16 flex items-center px-6 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="w-px h-5 bg-gray-700" />
            <div className="flex items-center gap-3">
              <div className="relative w-7 h-7">
                <Image src="/LOGO MOUNTAIN.png" alt="MCC" fill className="object-contain" sizes="28px" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
                Tile Collections
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="text-gray-400 hover:text-[#c9a84c] text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/visualizer"
              className="bg-[#c9a84c] hover:bg-[#b8943e] text-white text-xs font-bold px-5 py-2.5 uppercase tracking-widest transition-colors"
            >
              Visualizer
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-[#0a0c12] py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-5">
            <span className="inline-block w-10 h-px bg-[#c9a84c]" />
            Our Collections
            <span className="inline-block w-10 h-px bg-[#c9a84c]" />
          </span>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-5">
            Browse by Collection
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Each collection brings together tiles with a shared design language.
            Select any collection to explore its tiles and visualize them in a real room.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-20">

        {/* ── Featured collections ─────────────────────────────── */}
        {featuredCollections.length > 0 && (
          <div>
            <h2 className="font-playfair text-3xl font-bold text-[#0f1117] mb-8">
              Featured Collections
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredCollections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  products={products}
                  large
                />
              ))}
            </div>
          </div>
        )}

        {/* ── All collections ───────────────────────────────────── */}
        {regularCollections.length > 0 && (
          <div>
            <h2 className="font-playfair text-3xl font-bold text-[#0f1117] mb-8">
              All Collections
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularCollections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  products={products}
                />
              ))}
            </div>
          </div>
        )}

        {collections.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg mb-3">No collections yet.</p>
            <Link href="/admin" className="text-[#c9a84c] hover:underline text-sm font-semibold">
              Add collections in the Admin Portal →
            </Link>
          </div>
        )}
      </div>

      {/* Footer strip */}
      <div className="bg-[#0a0c12] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Mountain Ceramics Company</p>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-500 hover:text-[#c9a84c] text-sm transition-colors">Home</Link>
            <Link href="/projects" className="text-gray-500 hover:text-[#c9a84c] text-sm transition-colors">Projects</Link>
            <Link href="/visualizer" className="text-gray-500 hover:text-[#c9a84c] text-sm transition-colors">Visualizer</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Collection card ──────────────────────────────────────────────────────────

function CollectionCard({
  collection,
  products,
  large = false,
}: {
  collection: Collection;
  products: Product[];
  large?: boolean;
}) {
  const tiles = products.filter((p) => collection.tileIds.includes(p.id));
  const wallTiles  = tiles.filter((p) => p.category === "wall" || p.category === "special");
  const floorTiles = tiles.filter((p) => p.category === "floor" || p.category === "outdoor");

  // Build visualizer URLs
  const firstTile      = tiles[0];
  const surface        = firstTile?.category === "wall" || firstTile?.category === "special" ? "wall" : "floor";
  const visualizerUrl  = firstTile
    ? `/visualizer?collection=${encodeURIComponent(collection.name)}&tile=${firstTile.id}&surface=${surface}`
    : `/visualizer?collection=${encodeURIComponent(collection.name)}`;
  const panoramaUrl    = `/visualizer/panorama?collection=${encodeURIComponent(collection.name)}`;

  return (
    <div className={`bg-white group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col ${large ? "md:flex-row" : ""}`}>

      {/* Image */}
      <div className={`relative overflow-hidden ${large ? "md:w-1/2 min-h-[280px]" : "min-h-[220px]"}`}>
        <Image
          src={collection.image}
          alt={collection.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes={large ? "(max-width: 768px) 100vw, 50vw" : "33vw"}
          unoptimized={collection.image.startsWith("data:") || collection.image.startsWith("/uploads/")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {collection.featured && (
          <span className="absolute top-4 left-0 bg-[#c9a84c] text-white text-[10px] font-bold px-4 py-1.5 uppercase tracking-widest">
            Featured
          </span>
        )}
        {/* Tile count badge */}
        <div className="absolute bottom-4 left-4 bg-[#0a0c12]/80 backdrop-blur-sm px-3 py-1.5">
          <span className="text-white text-xs font-bold">{tiles.length} tile{tiles.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Content */}
      <div className={`flex flex-col justify-between p-6 ${large ? "md:w-1/2" : ""}`}>
        <div>
          <span className="text-[#c9a84c] text-[10px] font-bold tracking-[0.25em] uppercase mb-2 block">
            Collection
          </span>
          <h3 className="font-playfair text-2xl font-bold text-[#0f1117] mb-3 group-hover:text-[#c9a84c] transition-colors duration-200">
            {collection.name}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            {collection.description}
          </p>

          {/* Surface badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {wallTiles.length > 0 && (
              <span className="flex items-center gap-1.5 bg-[#0f1117]/5 text-[#0f1117] text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
                </svg>
                Wall ({wallTiles.length})
              </span>
            )}
            {floorTiles.length > 0 && (
              <span className="flex items-center gap-1.5 bg-[#0f1117]/5 text-[#0f1117] text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5" />
                </svg>
                Floor ({floorTiles.length})
              </span>
            )}
          </div>

          {/* Tile thumbnails */}
          {tiles.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {tiles.slice(0, 5).map((t) => (
                <div key={t.id} className="relative w-10 h-10 overflow-hidden border-2 border-gray-100 hover:border-[#c9a84c] transition-colors" title={t.name}>
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized={t.image.startsWith("data:") || t.image.startsWith("/uploads/")}
                  />
                </div>
              ))}
              {tiles.length > 5 && (
                <div className="w-10 h-10 border-2 border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                  +{tiles.length - 5}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <Link
            href={panoramaUrl}
            className="group/btn w-full bg-[#c9a84c] hover:bg-[#b8943e] text-white font-bold py-3.5 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2.5"
          >
            {/* 360 icon */}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
            </svg>
            Panorama View
            <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href={visualizerUrl}
            className="group/btn w-full bg-[#0f1117] hover:bg-[#1e2330] text-white font-bold py-3 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2.5 border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Flat Visualizer
          </Link>
        </div>
      </div>
    </div>
  );
}

