"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, type Product } from "@/lib/api";

const filters = [
  { key: "all",     label: "All Collections" },
  { key: "floor",   label: "Floor Tiles" },
  { key: "wall",    label: "Wall Tiles" },
  { key: "outdoor", label: "Outdoor" },
  { key: "special", label: "Special Finish" },
];

export default function Products() {
  const [active,   setActive]   = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  const filtered = active === "all"
    ? products
    : products.filter((p) => p.category === active);

  if (!mounted) {
    return (
      <section id="products" className="py-24 bg-[#f8f7f4]">
        <div className="max-w-7xl mx-auto px-6 text-center py-20 text-gray-400 text-sm animate-pulse">
          Loading collections…
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-24 bg-[#f8f7f4]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-4">
              <span className="gold-divider" />
              Our Collections
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[#0f1117] leading-tight">
              Tiles for Every<br />Space &amp; Style
            </h2>
          </div>
          <p className="text-gray-500 text-base max-w-sm leading-relaxed md:text-right">
            From classic ceramics to modern large-format porcelain — covering every design vision.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-12 border-b border-gray-200 pb-6">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                active === f.key
                  ? "bg-[#0f1117] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/tiles/${p.id}`}
              className="bg-white group overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 block"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden bg-gray-100">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={p.image.startsWith("data:") || p.image.startsWith("/uploads/")}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#0f1117]/0 group-hover:bg-[#0f1117]/40 transition-all duration-500 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 text-white text-xs font-bold tracking-widest uppercase">
                    View Details
                  </span>
                </div>
                {/* Badge */}
                {p.badge && (
                  <span className={`absolute top-4 left-0 text-xs font-bold px-4 py-1.5 tracking-wider uppercase ${
                    p.badge === "New"       ? "bg-emerald-500 text-white"
                    : p.badge === "Premium" ? "bg-[#0f1117] text-[#c9a84c]"
                    : "bg-[#c9a84c] text-white"
                  }`}>
                    {p.badge}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-6 border-t border-gray-100">
                <span className="text-[#c9a84c] text-[10px] font-bold tracking-[0.25em] uppercase mb-2 block">
                  {p.categoryLabel}
                </span>
                <h3 className="text-lg font-bold text-[#0f1117] mb-2 group-hover:text-[#c9a84c] transition-colors duration-200">
                  {p.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-gray-400 text-xs font-medium">{p.sizes}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {p.colors.map((c, i) => (
                        <span
                          key={i}
                          title={c}
                          className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-wider whitespace-nowrap">
                      View →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-14 pt-10 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Showing <strong className="text-[#0f1117]">{filtered.length}</strong> products.
            Full catalogue available on request.
          </p>
          <Link
            href="/catalogue"
            className="group bg-[#0f1117] hover:bg-[#c9a84c] text-white font-bold px-9 py-4 transition-all duration-300 shadow-lg flex items-center gap-3 text-sm tracking-widest uppercase"
          >
            View Full Catalogue
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
