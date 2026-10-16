"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, type Collection, type Product } from "@/lib/api";

export default function FeaturedCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([api.getCollections(), api.getProducts()])
      .then(([cols, prods]) => {
        setCollections(cols);
        setProducts(prods);
      })
      .catch(console.error);
  }, []);

  // Show featured first, then rest — limit to 6
  const sorted = [
    ...collections.filter((c) => c.featured),
    ...collections.filter((c) => !c.featured),
  ].slice(0, 6);

  if (!mounted || sorted.length === 0) return null;

  return (
    <section id="collections-home" className="py-24 bg-accent">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
              <span className="w-8 h-px bg-primary" />
              Our Collections
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold  leading-tight">
              Curated Tile<br />Collections
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <p className=" text-sm max-w-xs md:text-right leading-relaxed">
              Expertly grouped series for every space — residential, commercial, and beyond.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2  text-sm font-bold uppercase tracking-widest  transition-colors group"
            >
              View all collections
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Collection grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((col, i) => {
            const tiles = products.filter((p) => col.tileIds.includes(p.id));
            // Pick cover image: collection image first, then first tile image
            const cover = col.image || tiles.find((t) => t.image)?.image || "";
            const isLocal = cover.startsWith("/uploads/") || cover.startsWith("data:");

            return (
              <Link
                key={col.id}
                href={`/collections#col-${col.id}`}
                className={`group relative overflow-hidden bg-dark ${i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                {/* Cover image */}
                <div className="relative h-64 overflow-hidden">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={col.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted flex items-center justify-center">
                      <svg className="w-12 h-12 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                      </svg>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent group-hover:from-dark/95 transition-all duration-300" />

                  {/* Featured badge */}
                  {col.featured && (
                    <span className="absolute top-3 left-0 bg-primary  text-[9px] font-bold px-3 py-1 uppercase tracking-widest">
                      Featured
                    </span>
                  )}

                  {/* Tile count */}
                  <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm  text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {tiles.length} tile{tiles.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-bold  text-lg mb-1.5 group-hover: transition-colors duration-200">
                    {col.name}
                  </h3>
                  {col.description && (
                    <p className=" text-sm leading-relaxed line-clamp-2 mb-4">
                      {col.description}
                    </p>
                  )}

                  {/* Tile thumbnails */}
                  {tiles.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {tiles.slice(0, 5).map((t) => (
                        <div key={t.id} className="w-9 h-9 overflow-hidden rounded  /10 flex-shrink-0">
                          {t.image ? (
                            <img
                              src={t.image}
                              alt={t.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full " />
                          )}
                        </div>
                      ))}
                      {tiles.length > 5 && (
                        <div className="w-9 h-9 rounded  /10 flex-shrink-0 flex items-center justify-center /5">
                          <span className="text-[10px]  font-bold">+{tiles.length - 5}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex items-center gap-2  text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                    <span>Explore collection</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="flex items-center justify-center gap-6 mt-12 pt-10 -t /10">
          <Link
            href="/collections"
            className="bg-primary hover:bg-primary  font-bold px-8 py-4 text-sm tracking-widest uppercase transition-colors"
          >
            All Collections
          </Link>
          <Link
            href="/visualizer"
            className=" /20 hover:-primary  hover: font-bold px-8 py-4 text-sm tracking-widest uppercase transition-colors"
          >
            Visualize Tiles
          </Link>
        </div>
      </div>
    </section>
  );
}
