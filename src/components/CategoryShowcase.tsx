"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, type Product } from "@/lib/api";

// Static fallback images per category in case the DB has no products yet
const FALLBACKS: Record<string, string> = {
  floor: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
  wall: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
  outdoor: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
  special: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
};

const CATEGORY_META = [
  { key: "floor", title: "Floor Tiles", sub: "Natural & Polished", href: "/catalogue?category=floor", rowSpan: true },
  { key: "wall", title: "Wall Tiles", sub: "Gloss & Matte", href: "/catalogue?category=wall", rowSpan: false },
  { key: "outdoor", title: "Outdoor Tiles", sub: "UV & Slip Resistant", href: "/catalogue?category=outdoor", rowSpan: false },
  { key: "special", title: "Special Finish", sub: "Metallic & Decorative", href: "/catalogue?category=special", rowSpan: false },
  { key: "floor2", title: "Large Format", sub: "600×1200mm+", href: "/catalogue", rowSpan: false },
];

export default function CategoryShowcase() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  // Pick the first product with an image per category
  function getBestImage(categoryKey: string): string {
    const key = categoryKey === "floor2" ? "floor" : categoryKey;
    // prefer featured, then any with an image
    const pool = products.filter((p) => p.category === key && p.image);
    const featured = pool.find((p) => p.featured);
    const pick = featured ?? pool[0];
    if (pick?.image) return pick.image;
    return FALLBACKS[key] ?? FALLBACKS.floor;
  }

  return (
    <section className="py-24 ">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
            <span className="gold-divider" />
            Browse by Category
            <span className="gold-divider" />
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold ">
            Find Your Perfect Tile
          </h2>
        </div>

        {/* Mosaic grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 grid-rows-2 gap-3 h-[600px] md:h-[540px]">
          {CATEGORY_META.map((cat, i) => {
            const imgSrc = getBestImage(cat.key);
            const isLocal = imgSrc.startsWith("/uploads/") || imgSrc.startsWith("data:");
            return (
              <a
                key={cat.key}
                href={cat.href}
                className={`relative overflow-hidden group category-card ${i === 0 ? "row-span-2" : ""
                  }`}
              >
                <Image
                  src={imgSrc}
                  alt={cat.title}
                  fill
                  className="object-cover category-img"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  unoptimized
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark/85 via-dark/20 to-transparent group-hover:from-dark/90 transition-all duration-300" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <p className=" text-[10px] font-bold tracking-[0.25em] uppercase mb-1">{cat.sub}</p>
                  <h3 className=" font-bold text-lg md:text-xl leading-tight">{cat.title}</h3>
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className=" text-xs font-semibold tracking-wider uppercase">Browse</span>
                    <svg className="w-3.5 h-3.5 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Corner accent */}
                <div className="absolute top-4 right-4 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="absolute top-0 right-0 w-full h-px bg-primary" />
                  <span className="absolute top-0 right-0 w-px h-full bg-primary" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
