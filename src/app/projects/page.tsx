"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, type Project, type Product } from "@/lib/api";

const TYPE_COLORS: Record<string, string> = {
  Hospitality:    "bg-amber-500",
  Commercial:     "bg-blue-500",
  Residential:    "bg-emerald-500",
  Infrastructure: "bg-slate-500",
  Healthcare:     "bg-rose-500",
  Education:      "bg-purple-500",
  Industrial:     "bg-orange-500",
  Other:          "bg-gray-500",
};

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? "bg-gray-500";
}

export default function ProjectsPage() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [mounted, setMounted]     = useState(false);
  const [activeType, setActiveType] = useState("All");
  const [selected, setSelected]   = useState<Project | null>(null);

  useEffect(() => {
    setMounted(true);
    api.getProjects().then(setProjects).catch(console.error);
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <div className="text-white/50 text-sm animate-pulse">Loading projects…</div>
      </div>
    );
  }

  const types = ["All", ...Array.from(new Set(projects.map((p) => p.type)))];
  const filtered = activeType === "All" ? projects : projects.filter((p) => p.type === activeType);

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
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
                Project Portfolio
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/collections" className="text-gray-400 hover:text-[#c9a84c] text-xs font-bold uppercase tracking-widest transition-colors">
              Collections
            </Link>
            <Link href="/visualizer" className="bg-[#c9a84c] hover:bg-[#b8943e] text-white text-xs font-bold px-5 py-2.5 uppercase tracking-widest transition-colors">
              Visualizer
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-[#0a0c12] py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-5">
            <span className="inline-block w-10 h-px bg-[#c9a84c]" />
            Our Work
            <span className="inline-block w-10 h-px bg-[#c9a84c]" />
          </span>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-5">
            Project Portfolio
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tiles shaping Rwanda&apos;s most iconic spaces. Click any project to see
            which tiles were used — and visualize them in your own space.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 mt-12">
            {[
              { num: projects.length, label: "Projects" },
              { num: types.length - 1, label: "Sectors" },
              { num: products.length, label: "Tile Designs" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-playfair text-4xl font-bold text-[#c9a84c]">{s.num}+</div>
                <div className="text-gray-500 text-xs tracking-widest uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── Filter tabs ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-10">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-5 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                activeType === t
                  ? "bg-[#0f1117] text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Project grid ────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg mb-3">No projects yet.</p>
            <Link href="/admin" className="text-[#c9a84c] hover:underline text-sm font-semibold">
              Add projects in the Admin Portal →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((proj) => {
              const tiles = products.filter((p) => proj.tileIds?.includes(p.id));
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelected(proj)}
                  className="bg-white text-left group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={proj.image}
                      alt={proj.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized={proj.image.startsWith("data:") || proj.image.startsWith("/uploads/")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {/* Type badge */}
                    <span className={`absolute top-4 left-0 ${typeColor(proj.type)} text-white text-[10px] font-bold px-4 py-1.5 uppercase tracking-widest`}>
                      {proj.type}
                    </span>
                    {/* Tile thumbnails on hover */}
                    {tiles.length > 0 && (
                      <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {tiles.slice(0, 3).map((t) => (
                          <div key={t.id} className="w-8 h-8 overflow-hidden border-2 border-white/60">
                            <Image src={t.image} alt={t.name} width={32} height={32} className="object-cover" unoptimized={t.image.startsWith("data:") || t.image.startsWith("/uploads/")} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-playfair text-lg font-bold text-[#0f1117] mb-2 group-hover:text-[#c9a84c] transition-colors leading-snug">
                      {proj.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                      {proj.description}
                    </p>
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                      {proj.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {proj.location}
                        </span>
                      )}
                      {proj.area && (
                        <span className="text-xs text-gray-400">{proj.area}</span>
                      )}
                      {proj.year && (
                        <span className="text-xs text-gray-400">{proj.year}</span>
                      )}
                      {tiles.length > 0 && (
                        <span className="ml-auto text-xs font-bold text-[#c9a84c]">
                          {tiles.length} tile{tiles.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer strip */}
      <div className="bg-[#0a0c12] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Mountain Ceramics Company</p>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-500 hover:text-[#c9a84c] text-sm transition-colors">Home</Link>
            <Link href="/collections" className="text-gray-500 hover:text-[#c9a84c] text-sm transition-colors">Collections</Link>
            <Link href="/visualizer" className="text-gray-500 hover:text-[#c9a84c] text-sm transition-colors">Visualizer</Link>
          </div>
        </div>
      </div>

      {/* ── Project detail drawer ─────────────────────────────── */}
      {selected && (
        <ProjectDrawer
          project={selected}
          products={products}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── Project detail drawer ────────────────────────────────────────────────────

function ProjectDrawer({
  project,
  products,
  onClose,
}: {
  project: Project;
  products: Product[];
  onClose: () => void;
}) {
  const tiles      = products.filter((p) => project.tileIds?.includes(p.id));
  const wallTiles  = tiles.filter((p) => p.category === "wall" || p.category === "special");
  const floorTiles = tiles.filter((p) => p.category === "floor" || p.category === "outdoor");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-right">

        {/* Header */}
        <div className="relative h-56 flex-shrink-0">
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover"
            sizes="580px"
            unoptimized={project.image.startsWith("data:") || project.image.startsWith("/uploads/")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className={`inline-block ${typeColor(project.type)} text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest mb-2`}>
              {project.type}
            </span>
            <h2 className="font-playfair text-white font-bold text-2xl leading-tight">{project.title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7">

          {/* Meta */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Location", val: project.location || "—" },
              { label: "Area",     val: project.area     || "—" },
              { label: "Year",     val: project.year     || "—" },
            ].map((m) => (
              <div key={m.label} className="bg-[#f8f7f4] p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{m.label}</p>
                <p className="text-sm font-bold text-[#0f1117]">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-600 text-sm leading-relaxed">{project.description}</p>
          </div>

          {/* Tiles used */}
          {tiles.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">
                Tiles Used in This Project
              </h3>

              {/* Wall tiles */}
              {wallTiles.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-widest mb-2">
                    Wall Tiles
                  </p>
                  <div className="space-y-2">
                    {wallTiles.map((tile) => (
                      <TileRow key={tile.id} tile={tile} surface="wall" />
                    ))}
                  </div>
                </div>
              )}

              {/* Floor tiles */}
              {floorTiles.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-widest mb-2">
                    Floor Tiles
                  </p>
                  <div className="space-y-2">
                    {floorTiles.map((tile) => (
                      <TileRow key={tile.id} tile={tile} surface="floor" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic">No tiles linked to this project yet.</p>
          )}

          {/* Visualize all tiles CTA */}
          {tiles.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs text-gray-400 text-center">See how these tiles look in a room</p>
              <Link
                href={`/visualizer?tile=${tiles[0].id}&surface=${
                  tiles[0].category === "wall" || tiles[0].category === "special" ? "wall" : "floor"
                }`}
                className="w-full bg-[#c9a84c] hover:bg-[#b8943e] text-white font-bold py-3.5 text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Visualize These Tiles
              </Link>
              <Link
                href="/#contact"
                onClick={onClose}
                className="w-full bg-[#0f1117] hover:bg-[#c9a84c] text-white font-bold py-3.5 text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
              >
                Request Similar Tiles
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function TileRow({ tile, surface }: { tile: Product; surface: "wall" | "floor" }) {
  return (
    <div className="flex items-center gap-3 bg-[#f8f7f4] p-2.5 group">
      <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden">
        <Image
          src={tile.image}
          alt={tile.name}
          fill
          className="object-cover"
          sizes="48px"
          unoptimized={tile.image.startsWith("data:") || tile.image.startsWith("/uploads/")}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#0f1117] text-sm truncate">{tile.name}</p>
        <p className="text-gray-400 text-xs">{tile.sizes} · {tile.categoryLabel}</p>
      </div>
      <Link
        href={`/visualizer?tile=${tile.id}&surface=${surface}&autoApply=1`}
        className="flex-shrink-0 bg-[#0f1117] group-hover:bg-[#c9a84c] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-wider transition-colors"
      >
        Try it
      </Link>
    </div>
  );
}

