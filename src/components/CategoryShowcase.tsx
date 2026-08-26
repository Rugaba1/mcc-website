import Image from "next/image";

const categories = [
  {
    title: "Floor Tiles",
    sub: "Natural & Polished",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    href: "/visualizer?category=floor",
    span: "col-span-1 row-span-2",
  },
  {
    title: "Wall Tiles",
    sub: "Gloss & Matte",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
    href: "/visualizer?category=wall",
    span: "col-span-1 row-span-1",
  },
  {
    title: "Outdoor Tiles",
    sub: "UV & Slip Resistant",
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
    href: "/visualizer?category=outdoor",
    span: "col-span-1 row-span-1",
  },
  {
    title: "Special Finish",
    sub: "Metallic & Decorative",
    image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
    href: "/visualizer?category=special",
    span: "col-span-1 row-span-1",
  },
  {
    title: "Large Format",
    sub: "600×1200mm+",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    href: "/visualizer?category=floor",
    span: "col-span-1 row-span-1",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-4">
            <span className="gold-divider" />
            Browse by Category
            <span className="gold-divider" />
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[#0f1117]">
            Find Your Perfect Tile
          </h2>
        </div>

        {/* Mosaic grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 grid-rows-2 gap-3 h-[600px] md:h-[540px]">
          {categories.map((cat, i) => (
            <a
              key={cat.title}
              href={cat.href}
              className={`relative overflow-hidden group category-card ${
                i === 0 ? "row-span-2" : ""
              }`}
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                className="object-cover category-img"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12]/85 via-[#0a0c12]/20 to-transparent group-hover:from-[#0a0c12]/90 transition-all duration-300" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <p className="text-[#c9a84c] text-[10px] font-bold tracking-[0.25em] uppercase mb-1">{cat.sub}</p>
                <h3 className="text-white font-bold text-lg md:text-xl leading-tight">{cat.title}</h3>
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-[#c9a84c] text-xs font-semibold tracking-wider uppercase">Visualize</span>
                  <svg className="w-3.5 h-3.5 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-4 right-4 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="absolute top-0 right-0 w-full h-px bg-[#c9a84c]" />
                <span className="absolute top-0 right-0 w-px h-full bg-[#c9a84c]" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
