"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, type Product } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type Surface = "wall" | "floor";
type GroutWidth = "small" | "medium" | "large";
type TileLayout = "straight" | "brick" | "herringbone" | "stack";
type FilterCategory = "all" | "floor" | "wall" | "outdoor" | "special";
type ViewMode = "grid" | "list";

const GROUT_PRESETS = [
  { label: "White", value: "#f5f5f5" },
  { label: "Grey", value: "#9ca3af" },
  { label: "Dark", value: "#4b5563" },
  { label: "Black", value: "#111827" },
];

const GROUT_PX: Record<GroutWidth, number> = { small: 2, medium: 4, large: 7 };
const TILE_PX: Record<TileLayout, number> = {
  straight: 80,
  brick: 80,
  herringbone: 60,
  stack: 80,
};

const GENERATION_STEPS = [
  { label: "Detecting surfaces…", duration: 1000 },
  { label: "Applying tile texture…", duration: 1500 },
  { label: "Rendering perspective…", duration: 1000 },
  { label: "Adding grout lines…", duration: 800 },
  { label: "Finalising visualization…", duration: 700 },
];

const CATEGORY_FILTERS: { key: FilterCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "floor", label: "Floor" },
  { key: "wall", label: "Wall" },
  { key: "outdoor", label: "Outdoor" },
  { key: "special", label: "Special" },
];

const ROOM_IMAGE = "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=85";

// ─── Grout overlay CSS ───────────────────────────────────────────────────────

function buildGroutStyle(
  layout: TileLayout,
  groutColor: string,
  groutWidth: GroutWidth
): React.CSSProperties {
  const g = GROUT_PX[groutWidth];
  const t = TILE_PX[layout];
  const step = t + g;

  if (layout === "straight" || layout === "stack") {
    return {
      background: [
        `repeating-linear-gradient(to right, ${groutColor} 0px, ${groutColor} ${g}px, transparent ${g}px, transparent ${step}px)`,
        `repeating-linear-gradient(to bottom, ${groutColor} 0px, ${groutColor} ${g}px, transparent ${g}px, transparent ${step}px)`,
      ].join(", "),
      opacity: 0.65,
    };
  }

  if (layout === "brick") {
    // horizontal lines every step, vertical offset rows
    return {
      background: [
        `repeating-linear-gradient(to bottom, ${groutColor} 0px, ${groutColor} ${g}px, transparent ${g}px, transparent ${step}px)`,
        `repeating-linear-gradient(to right, ${groutColor} 0px, ${groutColor} ${g}px, transparent ${g}px, transparent ${step}px)`,
      ].join(", "),
      backgroundSize: `${step}px ${step * 2}px, ${step}px ${step}px`,
      opacity: 0.6,
    };
  }

  // herringbone — diagonal grid approximation
  return {
    background: [
      `repeating-linear-gradient(45deg, ${groutColor} 0px, ${groutColor} ${g}px, transparent ${g}px, transparent ${t}px)`,
      `repeating-linear-gradient(-45deg, ${groutColor} 0px, ${groutColor} ${g}px, transparent ${g}px, transparent ${t}px)`,
    ].join(", "),
    opacity: 0.55,
  };
}

// ─── Helper: badge colour ────────────────────────────────────────────────────

function badgeClass(badge: Product["badge"]) {
  if (badge === "New") return "bg-emerald-500 text-white";
  if (badge === "Premium") return "bg-[#0f1117] text-[#c9a84c]";
  return "bg-[#c9a84c] text-white";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-4 h-4" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function VisualizerPage() {
  const searchParams = useSearchParams();

  // ── Catalog state ──
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>(
    (searchParams.get("category") as FilterCategory) ?? "all"
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [favorites, setFavorites] = useState<number[]>([]);

  // ── Visualizer state ──
  const [selectedTile, setSelectedTile] = useState<Product | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<Surface>("wall");
  const [wallTile, setWallTile] = useState<Product | null>(null);
  const [floorTile, setFloorTile] = useState<Product | null>(null);
  const [groutColor, setGroutColor] = useState("#9ca3af");
  const [groutPreset, setGroutPreset] = useState<string | null>("#9ca3af");
  const [groutWidth, setGroutWidth] = useState<GroutWidth>("medium");
  const [tileLayout, setTileLayout] = useState<TileLayout>("straight");
  const [compareMode, setCompareMode] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [isApplied, setIsApplied] = useState(false);

  // ── Generation overlay ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);

  // ── Mobile drawer ──
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null);

  const compareRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // ── Load products ──
  useEffect(() => {
    setMounted(true);

    const surfaceParam    = searchParams.get("surface") as Surface | null;
    const collectionParam = searchParams.get("collection");
    const tileParam       = searchParams.get("tile");
    const autoApply       = searchParams.get("autoApply") === "1";

    if (surfaceParam === "wall" || surfaceParam === "floor") {
      setSelectedSurface(surfaceParam);
    }

    // Load products first, then apply URL params
    api.getProducts().then((all) => {
      setProducts(all);

      if (collectionParam) {
        api.getCollections().then((cols) => {
          const col = cols.find((c) => c.name === collectionParam);
          if (col && col.tileIds.length > 0) {
            const colTiles = all.filter((p) => col.tileIds.includes(p.id));
            if (colTiles.length > 0) {
              const first = colTiles[0];
              setSelectedTile(first);
              const surf: Surface =
                surfaceParam ??
                (first.category === "wall" || first.category === "special" ? "wall" : "floor");
              setSelectedSurface(surf);
              if (surf === "wall") setWallTile(first);
              else setFloorTile(first);
            }
          }
        }).catch(console.error);
      } else if (tileParam) {
        const found = all.find((p) => p.id === Number(tileParam));
        if (found) {
          setSelectedTile(found);
          const surf: Surface =
            surfaceParam ??
            (found.category === "wall" || found.category === "special" ? "wall" : "floor");
          setSelectedSurface(surf);
          if (autoApply) {
            if (surf === "wall") setWallTile(found);
            else setFloorTile(found);
          }
        }
      }
    }).catch(console.error);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filtered catalog ──
  const filteredProducts = products.filter((p) => {
    const matchCat = filterCategory === "all" || p.category === filterCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Visualize generation sequence ──
  const handleGenerate = useCallback(async () => {
    if (!wallTile && !floorTile) {
      showToast("Select a tile first, then click Visualize on a tile card.");
      return;
    }
    setIsGenerating(true);
    setGenerationProgress(0);

    const total = GENERATION_STEPS.reduce((s, x) => s + x.duration, 0);
    let elapsed = 0;

    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      const step = GENERATION_STEPS[i];
      setGenerationStep(step.label);
      await delay(step.duration);
      elapsed += step.duration;
      setGenerationProgress(Math.round((elapsed / total) * 100));
    }

    setIsGenerating(false);
    setIsApplied(true);
  }, [wallTile, floorTile]);

  // ── Select tile & apply to surface ──
  const handleSelectTile = (tile: Product) => {
    setSelectedTile(tile);
  };

  const handleVisualizeTile = (tile: Product) => {
    setSelectedTile(tile);
    if (selectedSurface === "wall") {
      setWallTile(tile);
    } else {
      setFloorTile(tile);
    }
    setIsApplied(false);
    setSidebarOpen(false);
  };

  // ── Favorites ──
  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // ── Reset ──
  const handleReset = () => {
    setWallTile(null);
    setFloorTile(null);
    setSelectedTile(null);
    setIsApplied(false);
    setCompareMode(false);
  };

  // ── Toast helper ──
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Compare drag ──
  const handleCompareDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!compareRef.current) return;
      const rect = compareRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      setComparePosition(pos);
    },
    []
  );

  const collectionName = searchParams.get("collection");

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <div className="text-white text-sm opacity-60">Loading visualizer…</div>
      </div>
    );
  }

  // ── Active tile for canvas ──
  const canvasWallTile = isApplied ? wallTile : null;
  const canvasFloorTile = isApplied ? floorTile : null;

  return (
    <div className="min-h-screen bg-[#0a0c12] flex flex-col overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <TopBar
        wallTile={wallTile}
        floorTile={floorTile}
        collectionName={collectionName}
        onReset={handleReset}
        onDownload={() => showToast("Download feature coming soon.")}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onToggleControls={() => setControlsOpen((v) => !v)}
      />

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR — tile catalog ─────────────────────────────── */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40 
            w-80 bg-[#f8f7f4] flex flex-col border-r border-gray-200
            transform transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            top-[56px]
          `}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#0f1117] text-sm tracking-wide uppercase">Tile Catalog</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-colors ${viewMode === "grid" ? "text-[#c9a84c]" : "text-gray-400 hover:text-gray-600"}`}
                  title="Grid view"
                >
                  <GridIcon />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-colors ${viewMode === "list" ? "text-[#c9a84c]" : "text-gray-400 hover:text-gray-600"}`}
                  title="List view"
                >
                  <ListIcon />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tiles…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 bg-[#f8f7f4] focus:outline-none focus:border-[#c9a84c] placeholder-gray-400"
              />
              <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1">
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterCategory(f.key)}
                  className={`px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all ${
                    filterCategory === f.key
                      ? "bg-[#0f1117] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tile list */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-10">No tiles found.</p>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-2">
                {filteredProducts.map((tile) => (
                  <TileCardGrid
                    key={tile.id}
                    tile={tile}
                    isSelected={selectedTile?.id === tile.id}
                    isFavorite={favorites.includes(tile.id)}
                    onSelect={() => handleSelectTile(tile)}
                    onVisualize={() => handleVisualizeTile(tile)}
                    onToggleFavorite={() => toggleFavorite(tile.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((tile) => (
                  <TileCardList
                    key={tile.id}
                    tile={tile}
                    isSelected={selectedTile?.id === tile.id}
                    isFavorite={favorites.includes(tile.id)}
                    onSelect={() => handleSelectTile(tile)}
                    onVisualize={() => handleVisualizeTile(tile)}
                    onToggleFavorite={() => toggleFavorite(tile.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Applying to surface badge */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Applying to:</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSurface("wall")}
                className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
                  selectedSurface === "wall" ? "bg-[#c9a84c] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                Wall
              </button>
              <button
                onClick={() => setSelectedSurface("floor")}
                className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
                  selectedSurface === "floor" ? "bg-[#c9a84c] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                Floor
              </button>
            </div>
          </div>
        </aside>

        {/* ── CENTER — Room canvas ─────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-center bg-[#0a0c12] p-4 md:p-8 overflow-auto">
          <div className="w-full max-w-3xl">
            {/* Canvas */}
            <div
              ref={compareRef}
              className="relative overflow-hidden bg-gray-900 shadow-2xl"
              style={{ aspectRatio: "4/3" }}
              onMouseMove={compareMode ? handleCompareDrag : undefined}
              onTouchMove={compareMode ? handleCompareDrag : undefined}
            >
              {/* Room image */}
              <Image
                src={ROOM_IMAGE}
                alt="Room"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 800px"
              />

              {/* Wall tile overlay */}
              {canvasWallTile && (
                <WallOverlay
                  tile={canvasWallTile}
                  groutColor={groutColor}
                  groutWidth={groutWidth}
                  tileLayout={tileLayout}
                />
              )}

              {/* Floor tile overlay */}
              {canvasFloorTile && (
                <FloorOverlay
                  tile={canvasFloorTile}
                  groutColor={groutColor}
                  groutWidth={groutWidth}
                  tileLayout={tileLayout}
                />
              )}

              {/* Compare slider */}
              {compareMode && (
                <CompareSlider position={comparePosition} onDrag={handleCompareDrag} />
              )}

              {/* No tile selected hint */}
              {!isApplied && !isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 text-white text-sm px-5 py-3 text-center backdrop-blur-sm">
                    <p className="font-semibold">Select a tile &amp; click "Visualize"</p>
                    <p className="text-xs text-gray-300 mt-1">Or click "Generate Look" below</p>
                  </div>
                </div>
              )}
            </div>

            {/* Generate button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (!wallTile && !floorTile)}
                className="flex-1 w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 tracking-widest uppercase text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Spinner />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Generate Look
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="sm:w-auto w-full border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white font-bold py-3.5 px-6 tracking-widest uppercase text-sm transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Applied tiles summary */}
            {(wallTile || floorTile) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {wallTile && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 text-white text-xs">
                    <span className="text-[#c9a84c] font-bold uppercase tracking-wider">Wall:</span>
                    <span>{wallTile.name}</span>
                    <button onClick={() => { setWallTile(null); setIsApplied(false); }} className="text-gray-400 hover:text-white ml-1">×</button>
                  </div>
                )}
                {floorTile && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 text-white text-xs">
                    <span className="text-[#c9a84c] font-bold uppercase tracking-wider">Floor:</span>
                    <span>{floorTile.name}</span>
                    <button onClick={() => { setFloorTile(null); setIsApplied(false); }} className="text-gray-400 hover:text-white ml-1">×</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT CONTROLS ───────────────────────────────────────────── */}
        <aside
          className={`
            fixed md:static inset-y-0 right-0 z-40
            w-72 bg-white flex flex-col border-l border-gray-200
            transform transition-transform duration-300
            ${controlsOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
            top-[56px]
          `}
        >
          <div className="flex-1 overflow-y-auto">
            {/* Surface selector */}
            <ControlSection title="Surface">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSurface("wall")}
                  className={`flex-1 py-2.5 text-xs font-bold tracking-wider uppercase border transition-all ${
                    selectedSurface === "wall"
                      ? "bg-[#0f1117] text-white border-[#0f1117]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  Wall
                </button>
                <button
                  onClick={() => setSelectedSurface("floor")}
                  className={`flex-1 py-2.5 text-xs font-bold tracking-wider uppercase border transition-all ${
                    selectedSurface === "floor"
                      ? "bg-[#0f1117] text-white border-[#0f1117]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  Floor
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  Wall: <span className="font-semibold text-[#0f1117]">{wallTile?.name ?? "—"}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Floor: <span className="font-semibold text-[#0f1117]">{floorTile?.name ?? "—"}</span>
                </p>
              </div>
            </ControlSection>

            {/* Grout controls */}
            <ControlSection title="Grout Color">
              <div className="flex flex-wrap gap-2 mb-3">
                {GROUT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setGroutColor(p.value); setGroutPreset(p.value); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border transition-all ${
                      groutPreset === p.value ? "border-[#c9a84c] bg-[#c9a84c]/10" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-gray-300" style={{ background: p.value }} />
                    {p.label}
                  </button>
                ))}
                <label className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border cursor-pointer transition-all ${
                  groutPreset === "custom" ? "border-[#c9a84c] bg-[#c9a84c]/10" : "border-gray-200 hover:border-gray-400"
                }`}>
                  <input
                    type="color"
                    value={groutColor}
                    onChange={(e) => { setGroutColor(e.target.value); setGroutPreset("custom"); }}
                    className="w-3 h-3 p-0 border-0 bg-transparent cursor-pointer"
                  />
                  Custom
                </label>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Width</p>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as GroutWidth[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => setGroutWidth(w)}
                      className={`flex-1 py-1.5 text-xs font-bold capitalize tracking-wider border transition-all ${
                        groutWidth === w
                          ? "bg-[#0f1117] text-white border-[#0f1117]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </ControlSection>

            {/* Layout controls */}
            <ControlSection title="Tile Layout">
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "straight", label: "Straight" },
                  { key: "brick", label: "Brick / Offset" },
                  { key: "herringbone", label: "Herringbone" },
                  { key: "stack", label: "Stack" },
                ] as { key: TileLayout; label: string }[]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTileLayout(opt.key)}
                    className={`py-2 text-xs font-bold tracking-wider border transition-all ${
                      tileLayout === opt.key
                        ? "bg-[#0f1117] text-white border-[#0f1117]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </ControlSection>

            {/* Compare toggle */}
            <ControlSection title="Before / After">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compare slider</span>
                <button
                  onClick={() => setCompareMode((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${compareMode ? "bg-[#c9a84c]" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${compareMode ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              {compareMode && (
                <p className="text-xs text-gray-500 mt-2">Drag the slider on the room image to compare.</p>
              )}
            </ControlSection>

            {/* Actions */}
            <ControlSection title="Actions">
              <div className="space-y-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!wallTile && !floorTile)}
                  className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 text-white font-bold py-2.5 tracking-widest uppercase text-xs transition-colors"
                >
                  Generate Look
                </button>
                <button
                  onClick={handleReset}
                  className="w-full border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 font-bold py-2.5 tracking-widest uppercase text-xs transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => showToast("Download feature coming soon.")}
                  className="w-full border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 font-bold py-2.5 tracking-widest uppercase text-xs transition-colors"
                >
                  Download
                </button>
                <Link
                  href="/"
                  className="w-full flex items-center justify-center border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 font-bold py-2.5 tracking-widest uppercase text-xs transition-colors"
                >
                  ← Back to Site
                </Link>
              </div>
            </ControlSection>
          </div>
        </aside>
      </div>

      {/* ── MOBILE bottom buttons ───────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0c12] border-t border-gray-800 flex z-30">
        <button
          onClick={() => { setSidebarOpen((v) => !v); setControlsOpen(false); }}
          className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-gray-300 hover:text-white transition-colors flex flex-col items-center gap-1"
        >
          <GridIcon />
          Catalog
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || (!wallTile && !floorTile)}
          className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase bg-[#c9a84c] text-white disabled:opacity-40"
        >
          Visualize
        </button>
        <button
          onClick={() => { setControlsOpen((v) => !v); setSidebarOpen(false); }}
          className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-gray-300 hover:text-white transition-colors flex flex-col items-center gap-1"
        >
          <SettingsIcon />
          Controls
        </button>
      </div>

      {/* ── GENERATION OVERLAY ────────────────────────────────────────── */}
      {isGenerating && (
        <GenerationOverlay step={generationStep} progress={generationProgress} />
      )}

      {/* ── TOAST ────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-[#0f1117] text-white text-sm px-5 py-3 shadow-2xl z-50 flex items-center gap-2 animate-fade-up">
          <svg className="w-4 h-4 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast}
        </div>
      )}

      {/* ── Sidebar backdrop (mobile) ─────────────────────────────────── */}
      {(sidebarOpen || controlsOpen) && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 top-[56px]"
          onClick={() => { setSidebarOpen(false); setControlsOpen(false); }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TopBar({
  wallTile,
  floorTile,
  collectionName,
  onReset,
  onDownload,
  onToggleSidebar,
  onToggleControls,
}: {
  wallTile: Product | null;
  floorTile: Product | null;
  collectionName: string | null;
  onReset: () => void;
  onDownload: () => void;
  onToggleSidebar: () => void;
  onToggleControls: () => void;
}) {
  return (
    <header className="h-14 bg-[#0a0c12] border-b border-gray-800 flex items-center px-4 gap-4 shrink-0 z-50 relative">
      {/* Mobile catalog toggle */}
      <button onClick={onToggleSidebar} className="md:hidden text-gray-400 hover:text-white p-1">
        <GridIcon />
      </button>

      {/* Logo */}
      <Link href="/" className="shrink-0">
        <div className="w-7 h-7 relative">
          <Image src="/LOGO MOUNTAIN.png" alt="MCC" fill className="object-contain" sizes="28px" />
        </div>
      </Link>

      <div className="hidden sm:block w-px h-5 bg-gray-700" />

      <div className="hidden sm:flex flex-col leading-none">
        <h1 className="text-white font-bold text-sm tracking-wider uppercase">Tile Visualizer</h1>
        {collectionName && (
          <span className="text-[#c9a84c] text-[10px] tracking-widest uppercase font-semibold mt-0.5">
            {collectionName}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Applied tiles mini summary */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
        {wallTile && (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Wall: <span className="text-[#c9a84c] font-semibold">{wallTile.name}</span>
          </span>
        )}
        {floorTile && (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            Floor: <span className="text-[#c9a84c] font-semibold">{floorTile.name}</span>
          </span>
        )}
      </div>

      <div className="hidden lg:block w-px h-5 bg-gray-700" />

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1">
        <Link href="/collections" className="text-xs text-gray-400 hover:text-[#c9a84c] font-semibold uppercase tracking-wider px-3 py-1.5 hover:bg-white/5 transition-colors">
          Collections
        </Link>
        <Link href="/projects" className="text-xs text-gray-400 hover:text-[#c9a84c] font-semibold uppercase tracking-wider px-3 py-1.5 hover:bg-white/5 transition-colors">
          Projects
        </Link>
        <div className="w-px h-4 bg-gray-700 mx-1" />
        <button onClick={onReset} className="text-xs text-gray-400 hover:text-white font-semibold uppercase tracking-wider px-3 py-1.5 hover:bg-white/5 transition-colors">
          Reset
        </button>
        <button onClick={onDownload} className="text-xs text-gray-400 hover:text-white font-semibold uppercase tracking-wider px-3 py-1.5 hover:bg-white/5 transition-colors">
          Download
        </button>
        <Link href="/" className="text-xs text-gray-400 hover:text-white font-semibold uppercase tracking-wider px-3 py-1.5 hover:bg-white/5 transition-colors">
          ← Back
        </Link>
      </div>

      {/* Mobile controls toggle */}
      <button onClick={onToggleControls} className="md:hidden text-gray-400 hover:text-white p-1">
        <SettingsIcon />
      </button>
    </header>
  );
}

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border-b border-gray-100">
      <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function TileCardGrid({
  tile,
  isSelected,
  isFavorite,
  onSelect,
  onVisualize,
  onToggleFavorite,
}: {
  tile: Product;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onVisualize: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative bg-white overflow-hidden cursor-pointer group transition-all duration-200 ${
        isSelected ? "ring-2 ring-[#c9a84c] shadow-lg" : "hover:shadow-md"
      }`}
    >
      <div className="relative h-28 overflow-hidden bg-gray-100">
        <Image src={tile.image} alt={tile.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="140px" />
        {tile.badge && (
          <span className={`absolute top-1.5 left-0 text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase ${badgeClass(tile.badge)}`}>
            {tile.badge}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={`absolute top-1.5 right-1.5 p-1 rounded-full bg-white/80 hover:bg-white transition-colors ${isFavorite ? "text-red-500" : "text-gray-400"}`}
        >
          <HeartIcon filled={isFavorite} />
        </button>
      </div>
      <div className="p-2">
        <p className="text-[9px] text-[#c9a84c] font-bold uppercase tracking-wider mb-0.5">{tile.categoryLabel}</p>
        <p className="text-xs font-bold text-[#0f1117] leading-tight mb-1 truncate">{tile.name}</p>
        <p className="text-[10px] text-gray-400 mb-2">{tile.sizes}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onVisualize(); }}
          className="w-full bg-[#0f1117] hover:bg-[#c9a84c] text-white text-[9px] font-bold py-1.5 tracking-widest uppercase transition-colors"
        >
          Visualize
        </button>
      </div>
    </div>
  );
}

function TileCardList({
  tile,
  isSelected,
  isFavorite,
  onSelect,
  onVisualize,
  onToggleFavorite,
}: {
  tile: Product;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onVisualize: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 bg-white p-2 cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-2 ring-[#c9a84c]" : "hover:shadow-sm"
      }`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-gray-100">
        <Image src={tile.image} alt={tile.name} fill className="object-cover" sizes="56px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-[#c9a84c] font-bold uppercase tracking-wider">{tile.categoryLabel}</p>
        <p className="text-xs font-bold text-[#0f1117] truncate">{tile.name}</p>
        <p className="text-[10px] text-gray-400">{tile.sizes}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={`p-1 ${isFavorite ? "text-red-500" : "text-gray-300 hover:text-gray-500"}`}
        >
          <HeartIcon filled={isFavorite} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onVisualize(); }}
          className="bg-[#0f1117] hover:bg-[#c9a84c] text-white text-[9px] font-bold px-2 py-1 tracking-widest uppercase transition-colors"
        >
          Use
        </button>
      </div>
    </div>
  );
}

function WallOverlay({
  tile,
  groutColor,
  groutWidth,
  tileLayout,
}: {
  tile: Product;
  groutColor: string;
  groutWidth: GroutWidth;
  tileLayout: TileLayout;
}) {
  const groutStyle = buildGroutStyle(tileLayout, groutColor, groutWidth);
  return (
    <div className="absolute inset-x-0 top-0" style={{ height: "58%" }}>
      {/* Tile texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${tile.image})`,
          backgroundRepeat: "repeat",
          backgroundSize: tileLayout === "herringbone" ? "60px 60px" : "80px 80px",
          mixBlendMode: "multiply",
          opacity: 0.85,
        }}
      />
      {/* Grout overlay */}
      <div className="absolute inset-0" style={groutStyle} />
    </div>
  );
}

function FloorOverlay({
  tile,
  groutColor,
  groutWidth,
  tileLayout,
}: {
  tile: Product;
  groutColor: string;
  groutWidth: GroutWidth;
  tileLayout: TileLayout;
}) {
  const groutStyle = buildGroutStyle(tileLayout, groutColor, groutWidth);
  return (
    <div
      className="absolute inset-x-0 bottom-0"
      style={{
        height: "42%",
        perspective: "600px",
        perspectiveOrigin: "50% 0%",
      }}
    >
      <div
        className="absolute inset-0"
        style={{ transform: "rotateX(20deg)", transformOrigin: "top center" }}
      >
        {/* Tile texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${tile.image})`,
            backgroundRepeat: "repeat",
            backgroundSize: tileLayout === "herringbone" ? "60px 60px" : "80px 80px",
            mixBlendMode: "multiply",
            opacity: 0.8,
          }}
        />
        {/* Grout overlay */}
        <div className="absolute inset-0" style={groutStyle} />
      </div>
    </div>
  );
}

function CompareSlider({
  position,
  onDrag,
}: {
  position: number;
  onDrag: (e: React.MouseEvent | React.TouchEvent) => void;
}) {
  return (
    <>
      {/* Dim right side (before) */}
      <div
        className="absolute inset-0 bg-black/40 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize z-10 flex items-center justify-center"
        style={{ left: `${position}%` }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div
          className="w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center cursor-ew-resize"
          onMouseDown={(e) => { e.preventDefault(); }}
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3M16 9l3 3-3 3" />
          </svg>
        </div>
      </div>
      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">Before</div>
      <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">After</div>
      {/* drag capture overlay */}
      <div className="absolute inset-0 cursor-ew-resize" onMouseMove={onDrag} onTouchMove={onDrag} />
    </>
  );
}

function GenerationOverlay({ step, progress }: { step: string; progress: number }) {
  return (
    <div className="fixed inset-0 bg-[#0a0c12]/95 z-50 flex flex-col items-center justify-center gap-6 backdrop-blur-sm">
      {/* Animated ring */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-gray-800 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-transparent border-t-[#c9a84c] rounded-full animate-spin"
          style={{ animationDuration: "1s" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>

      <div className="text-center">
        <p className="text-white font-bold text-lg mb-1 animate-fade-in">{step}</p>
        <p className="text-gray-500 text-sm">AI-powered tile visualizer</p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-[#c9a84c] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-500 text-xs">{progress}%</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
