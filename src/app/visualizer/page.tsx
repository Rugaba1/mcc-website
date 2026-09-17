"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTexture } from "@/contexts/texture-context";
import { api, type Product } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
type Surface    = "wall" | "floor";
type GroutWidth = "small" | "medium" | "large";
type TileLayout = "straight" | "brick" | "herringbone" | "stack";
type FilterCat  = "all" | "floor" | "wall" | "outdoor" | "special";

// A quad is 4 corners: [topLeft, topRight, bottomRight, bottomLeft]
// each corner is [x, y] as 0‒1 fractions of the image dimensions
type Quad = [[number,number],[number,number],[number,number],[number,number]];

const GROUT_PX: Record<GroutWidth, number> = { small: 1, medium: 3, large: 6 };
const TILE_PX:  Record<TileLayout, number> = { straight: 96, brick: 96, herringbone: 72, stack: 96 };

const GROUT_SWATCHES = [
  { label: "White", value: "#f0ede8" },
  { label: "Sand",  value: "#d4c5a9" },
  { label: "Grey",  value: "#9ca3af" },
  { label: "Dark",  value: "#4b5563" },
  { label: "Black", value: "#111827" },
];

// ─── Room scene definitions ───────────────────────────────────────────────────
// floorQuad / wallQuad: perspective-correct polygons traced on each photo
// Coordinates are [x,y] as fractions of image width/height (0‒1)
const ROOM_SCENES = [
  {
    id: "living", label: "Living Room",
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=92",
    // floor — the visible floor area (trapezoidal, wider at bottom)
    floorQuad: [[0.0, 0.72],[1.0, 0.72],[1.0, 1.0],[0.0, 1.0]] as Quad,
    // wall — back wall behind the sofa
    wallQuad:  [[0.0, 0.0],[1.0, 0.0],[1.0, 0.60],[0.0, 0.60]] as Quad,
    floorLabelPos: { left: "50%", bottom: "6%" },
    wallLabelPos:  { right: "8%",  top: "6%" },
  },
  {
    id: "bathroom", label: "Bathroom",
    url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=92",
    floorQuad: [[0.05, 0.68],[0.95, 0.68],[1.0, 1.0],[0.0, 1.0]] as Quad,
    wallQuad:  [[0.0, 0.0],[1.0, 0.0],[1.0, 0.62],[0.0, 0.62]] as Quad,
    floorLabelPos: { left: "50%", bottom: "6%" },
    wallLabelPos:  { right: "8%",  top: "6%" },
  },
  {
    id: "kitchen", label: "Kitchen",
    url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=92",
    floorQuad: [[0.0, 0.70],[1.0, 0.70],[1.0, 1.0],[0.0, 1.0]] as Quad,
    wallQuad:  [[0.0, 0.0],[1.0, 0.0],[1.0, 0.58],[0.0, 0.58]] as Quad,
    floorLabelPos: { left: "50%", bottom: "6%" },
    wallLabelPos:  { right: "8%",  top: "6%" },
  },
  {
    id: "bedroom", label: "Bedroom",
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=92",
    floorQuad: [[0.0, 0.66],[1.0, 0.66],[1.0, 1.0],[0.0, 1.0]] as Quad,
    wallQuad:  [[0.0, 0.0],[1.0, 0.0],[1.0, 0.56],[0.0, 0.56]] as Quad,
    floorLabelPos: { left: "50%", bottom: "8%" },
    wallLabelPos:  { right: "8%",  top: "6%" },
  },
  {
    id: "outdoor", label: "Outdoor",
    url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1600&q=92",
    floorQuad: [[0.0, 0.60],[1.0, 0.60],[1.0, 1.0],[0.0, 1.0]] as Quad,
    wallQuad:  [[0.0, 0.0],[1.0, 0.0],[1.0, 0.50],[0.0, 0.50]] as Quad,
    floorLabelPos: { left: "50%", bottom: "8%" },
    wallLabelPos:  { right: "8%",  top: "6%" },
  },
] as const;
type Scene = typeof ROOM_SCENES[number];


// ─── Canvas room renderer ─────────────────────────────────────────────────────
// Renders: room photo base → warp floor tile into floorQuad → warp wall tile into wallQuad
// Uses homography so the tile looks genuinely perspective-correct inside the polygon

interface RoomCanvasProps {
  scene:        Scene;
  floorTile:    Product | null;
  wallTile:     Product | null;
  floorApplied: boolean;
  wallApplied:  boolean;
  layout:       TileLayout;
  groutColor:   string;
  groutWidth:   GroutWidth;
  surface:      Surface;
  onFloorClear: () => void;
  onWallClear:  () => void;
}

function RoomCanvas({
  scene, floorTile, wallTile, floorApplied, wallApplied,
  layout, groutColor, groutWidth, surface, onFloorClear, onWallClear,
}: RoomCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const roomImgRef = useRef<HTMLImageElement | null>(null);
  const tileImgRef = useRef<HTMLImageElement | null>(null);
  const wallImgRef = useRef<HTMLImageElement | null>(null);

  // Build a tiled texture onto an offscreen canvas
  const buildTileCanvas = useCallback((
    img: HTMLImageElement,
    tileW: number, tileH: number,
    gColor: string, gPx: number,
    lay: TileLayout,
    outSize = 1024,
  ): HTMLCanvasElement => {
    const c   = document.createElement("canvas");
    c.width   = outSize; c.height = outSize;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = gColor;
    ctx.fillRect(0, 0, outSize, outSize);
    const pw = tileW + gPx;
    const ph = tileH + gPx;
    for (let row = -1; row < Math.ceil(outSize / ph) + 2; row++) {
      const ox = lay === "brick" && row % 2 !== 0 ? pw / 2 : 0;
      for (let col = -1; col < Math.ceil(outSize / pw) + 2; col++) {
        const x = col * pw + ox + gPx / 2;
        const y = row * ph + gPx / 2;
        ctx.drawImage(img, x, y, tileW - gPx, tileH - gPx);
      }
    }
    return c;
  }, []);

  // Perspective-warp a tiled texture into a quad using horizontal scanline strips.
  // For each row, the strip spans from the left edge to the right edge of the quad.
  // We compute the 2D affine transform that maps the texture strip to screen and
  // use ctx.setTransform + ctx.drawImage — the same technique used by KILN.
  const drawWarpedQuad = useCallback((
    ctx: CanvasRenderingContext2D,
    tex: HTMLCanvasElement,
    quad: Quad,  // [TL, TR, BR, BL] in screen pixels, top-first
  ) => {
    const [tl, tr, br, bl] = quad;
    const ROWS = 100;
    const TW = tex.width;
    const TH = tex.height;

    ctx.save();
    // Clip strictly to the quad polygon
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.closePath();
    ctx.clip();

    for (let i = 0; i < ROWS; i++) {
      const t0 = i       / ROWS;
      const t1 = (i + 1) / ROWS;

      // Lerp left and right edges of the quad at t0 (top of strip) and t1 (bottom)
      const lx0 = tl[0] + (bl[0] - tl[0]) * t0;
      const ly0 = tl[1] + (bl[1] - tl[1]) * t0;
      const rx0 = tr[0] + (br[0] - tr[0]) * t0;
      const ry0 = tr[1] + (br[1] - tr[1]) * t0;

      const lx1 = tl[0] + (bl[0] - tl[0]) * t1;
      const ly1 = tl[1] + (bl[1] - tl[1]) * t1;
      const rx1 = tr[0] + (br[0] - tr[0]) * t1;
      const ry1 = tr[1] + (br[1] - tr[1]) * t1;

      // Source y-range in the texture (linear mapping — perspective comes from quad shape)
      const srcY0 = t0 * TH;
      const srcY1 = t1 * TH;
      const srcH  = srcY1 - srcY0;
      if (srcH < 0.5) continue;

      // The affine transform maps texture-space [0..TW, srcY0..srcY1]
      // to screen-space [lx0,ly0 → rx0,ry0 → lx1,ly1]:
      //   x_screen = a * x_tex + c * y_tex + e
      //   y_screen = b * x_tex + d * y_tex + f
      //
      // Constraints (3 points):
      //   (0,     srcY0) → (lx0, ly0)   [top-left]
      //   (TW,    srcY0) → (rx0, ry0)   [top-right]
      //   (0,     srcY1) → (lx1, ly1)   [bottom-left]
      //
      // From these:
      //   a*TW + e = rx0  →  a = (rx0 - lx0) / TW
      //   b*TW + f = ry0  →  b = (ry0 - ly0) / TW
      //   c*srcH = lx1 - lx0  →  c = (lx1 - lx0) / srcH
      //   d*srcH = ly1 - ly0  →  d = (ly1 - ly0) / srcH
      //   e = lx0 - c*srcY0
      //   f = ly0 - d*srcY0

      const a = (rx0 - lx0) / TW;
      const b = (ry0 - ly0) / TW;
      const c = (lx1 - lx0) / srcH;
      const d = (ly1 - ly0) / srcH;
      const e = lx0 - c * srcY0;
      const f = ly0 - d * srcY0;

      ctx.save();
      ctx.setTransform(a, b, c, d, e, f);
      // Draw just this horizontal strip from the texture
      ctx.drawImage(tex, 0, srcY0, TW, srcH, 0, srcY0, TW, srcH);
      ctx.restore();
    }

    ctx.restore();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap || !roomImgRef.current) return;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    if (W === 0 || H === 0) return;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    // Cover-fit dimensions (computed once, used for both photo and quad mapping)
    const img = roomImgRef.current;
    const iW  = img.naturalWidth  || W;
    const iH  = img.naturalHeight || H;
    const sc  = Math.max(W / iW, H / iH);
    const dw  = iW * sc, dh = iH * sc;
    const dx  = (W - dw) / 2, dy = (H - dh) / 2;

    // Convert a scene quad (0–1 fractions) → canvas pixel coords
    const toPixels = (q: Quad): Quad =>
      q.map(([fx, fy]) => [dx + fx * dw, dy + fy * dh]) as Quad;

    const gPx    = GROUT_PX[groutWidth];
    const tilePx = TILE_PX[layout];

    // ── Step 1: draw tiles FIRST (behind the photo) ──────────────────────────
    // Wall tiles
    if (wallApplied && wallTile && wallImgRef.current) {
      const tex  = buildTileCanvas(wallImgRef.current, tilePx, tilePx, groutColor, gPx, layout);
      const quad = toPixels(scene.wallQuad);
      drawWarpedQuad(ctx, tex, quad);
    }
    // Floor tiles
    if (floorApplied && floorTile && tileImgRef.current) {
      const tex  = buildTileCanvas(tileImgRef.current, tilePx, tilePx, groutColor, gPx, layout);
      const quad = toPixels(scene.floorQuad);
      drawWarpedQuad(ctx, tex, quad);
    }

    // ── Step 2: draw room photo on top with multiply blend ───────────────────
    // "multiply" darkens the tile wherever the photo is dark (furniture, shadows, walls)
    // so furniture naturally appears to sit ON TOP of the tile texture.
    // Where the photo is near-white (empty floor/wall) the tile shows through clearly.
    if (wallApplied || floorApplied) {
      ctx.globalCompositeOperation = "multiply";
    }
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.globalCompositeOperation = "source-over"; // reset
  }, [scene, floorTile, wallTile, floorApplied, wallApplied, layout, groutColor, groutWidth, buildTileCanvas, drawWarpedQuad]);

  // Load room image
  useEffect(() => {
    const img   = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => { roomImgRef.current = img; draw(); };
    img.onerror = () => { roomImgRef.current = null; };
    img.src     = scene.url;
  }, [scene.url, draw]);

  // Load floor tile image
  useEffect(() => {
    if (!floorTile?.image) { tileImgRef.current = null; draw(); return; }
    const img   = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => { tileImgRef.current = img; draw(); };
    img.src     = floorTile.image;
  }, [floorTile?.image, draw]);

  // Load wall tile image
  useEffect(() => {
    if (!wallTile?.image) { wallImgRef.current = null; draw(); return; }
    const img   = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => { wallImgRef.current = img; draw(); };
    img.src     = wallTile.image;
  }, [wallTile?.image, draw]);

  // Redraw when grout/layout changes
  useEffect(() => { draw(); }, [draw]);

  // Resize observer
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floor zone label */}
      <div className="absolute z-10 pointer-events-none" style={{ ...scene.floorLabelPos, transform: "translateX(-50%)" }}>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg select-none transition-colors ${
          floorApplied && floorTile ? "bg-[#2563eb] text-white" : "bg-white/85 text-gray-700 backdrop-blur-sm"
        }`}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5"/></svg>
          {floorApplied && floorTile ? floorTile.name : "Floor"}
          {floorApplied && (
            <button className="pointer-events-auto ml-0.5 opacity-70 hover:opacity-100" onClick={onFloorClear}>×</button>
          )}
        </span>
      </div>

      {/* Wall zone label */}
      <div className="absolute z-10 pointer-events-none" style={{ ...scene.wallLabelPos, transform: "translateX(-50%)" }}>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg select-none transition-colors ${
          wallApplied && wallTile ? "bg-[#2563eb] text-white" : "bg-white/85 text-gray-700 backdrop-blur-sm"
        }`}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
          {wallApplied && wallTile ? wallTile.name : "Wall"}
          {wallApplied && (
            <button className="pointer-events-auto ml-0.5 opacity-70 hover:opacity-100" onClick={onWallClear}>×</button>
          )}
        </span>
      </div>

      {/* Empty hint */}
      {!floorApplied && !wallApplied && (
        <div className="absolute inset-0 flex items-end justify-center pb-20 pointer-events-none z-10">
          <div className="bg-black/55 backdrop-blur-sm text-white text-sm px-5 py-3 text-center rounded-full shadow-xl">
            <span className="font-semibold">Tap a tile</span>
            <span className="text-white/70 ml-1.5">to lay it on the {surface}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VisualizerPage() {
  const searchParams = useSearchParams();

  // catalog
  const [products,     setProducts]     = useState<Product[]>([]);
  const [mounted,      setMounted]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [filterCat,    setFilterCat]    = useState<FilterCat>("all");
  const [favorites,    setFavorites]    = useState<number[]>([]);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  // visualizer
  const [surface,      setSurface]      = useState<Surface>("floor");
  const [wallTile,     setWallTile]     = useState<Product | null>(null);
  const [floorTile,    setFloorTile]    = useState<Product | null>(null);
  const [wallApplied,  setWallApplied]  = useState(false);
  const [floorApplied, setFloorApplied] = useState(false);
  const [scene,        setScene]        = useState<Scene>(ROOM_SCENES[0]);
  const [groutColor,   setGroutColor]   = useState("#9ca3af");
  const [groutWidth,   setGroutWidth]   = useState<GroutWidth>("medium");
  const [layout,       setLayout]       = useState<TileLayout>("straight");

  // toolbar panels
  const [groutOpen,    setGroutOpen]    = useState(false);
  const [layoutOpen,   setLayoutOpen]   = useState(false);
  const [appliedOpen,  setAppliedOpen]  = useState(false);
  const [sceneOpen,    setSceneOpen]    = useState(false);

  // texture context sync
  const { setTexture, setWallTexture, setWidth, setHeight, setDepth } = useTexture();
  useEffect(() => {
    if (floorApplied && floorTile) {
      const m = floorTile.sizes.match(/(\d+)[×x](\d+)/i);
      setTexture(floorTile.image);
      setWidth(m  ? parseInt(m[1]) / 10 : 60);
      setHeight(m ? parseInt(m[2]) / 10 : 60);
      setDepth(1);
    } else { setTexture(null); }
  }, [floorApplied, floorTile, setTexture, setWidth, setHeight, setDepth]);

  useEffect(() => {
    setWallTexture(wallApplied && wallTile ? wallTile.image : null);
  }, [wallApplied, wallTile, setWallTexture]);

  // load products
  useEffect(() => {
    setMounted(true);
    const sp = searchParams.get("surface") as Surface | null;
    if (sp === "wall" || sp === "floor") setSurface(sp);
    api.getProducts().then((all) => {
      setProducts(all);
      const tp   = searchParams.get("tile");
      const auto = searchParams.get("autoApply") === "1";
      if (tp) {
        const found = all.find((p) => p.id === Number(tp));
        if (found && auto) {
          const s: Surface = sp ?? (found.category === "wall" || found.category === "special" ? "wall" : "floor");
          if (s === "wall") { setWallTile(found); setWallApplied(true); }
          else              { setFloorTile(found); setFloorApplied(true); }
        }
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = products.filter((p) => {
    const mc = filterCat === "all" || p.category === filterCat;
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const applyTile = (tile: Product) => {
    if (surface === "wall") { setWallTile(tile); setWallApplied(true); }
    else                    { setFloorTile(tile); setFloorApplied(true); }
    setSidebarOpen(false);
  };

  const reset = () => {
    setWallTile(null); setFloorTile(null);
    setWallApplied(false); setFloorApplied(false);
  };

  const activeTile = surface === "floor" ? (floorApplied ? floorTile : null) : (wallApplied ? wallTile : null);

  if (!mounted) return (
    <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
      <div className="text-white/50 text-sm animate-pulse">Loading visualizer…</div>
    </div>
  );

  return (
    <div className="h-screen bg-white flex overflow-hidden font-sans">

      {/* ══════════ LEFT PANEL ══════════ */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-[280px] bg-white flex flex-col border-r border-gray-100
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-7 h-7 flex-shrink-0">
                <Image src="/LOGO MOUNTAIN.png" alt="MCC" fill className="object-contain" sizes="28px" />
              </div>
              <span className="font-bold text-[#0f1117] text-sm tracking-wide">MCC Tiles</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-700 p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Surface toggle */}
          <div className="flex gap-1.5 mb-3">
            {(["floor", "wall"] as Surface[]).map((s) => (
              <button key={s} onClick={() => setSurface(s)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  surface === s ? "bg-[#2563eb] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {s === "floor"
                  ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5"/></svg>
                  : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
                }
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input type="text" placeholder="Search tiles…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#2563eb] placeholder-gray-400" />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {(["all","floor","wall","outdoor","special"] as FilterCat[]).map((c) => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full transition-all ${
                  filterCat === c ? "bg-[#0f1117] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Tile list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <p className="text-center text-gray-400 text-xs py-10">No tiles found.</p>}
          {filtered.map((tile) => {
            const isActive = (surface === "floor" && floorTile?.id === tile.id && floorApplied)
                          || (surface === "wall"  && wallTile?.id  === tile.id && wallApplied);
            return (
              <button key={tile.id} onClick={() => applyTile(tile)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 hover:bg-blue-50 transition-colors group ${
                  isActive ? "bg-blue-50 border-l-2 border-l-[#2563eb]" : ""
                }`}>
                <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded border border-gray-100">
                  <Image src={tile.image} alt={tile.name} fill className="object-cover" sizes="48px" unoptimized={tile.image.startsWith("data:") || tile.image.startsWith("/uploads/")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? "text-[#2563eb]" : "text-[#0f1117] group-hover:text-[#2563eb]"}`}>{tile.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{tile.categoryLabel}</p>
                  <p className="text-[10px] text-gray-400">{tile.sizes}</p>
                  {tile.badge && (
                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                      tile.badge === "New" ? "bg-emerald-100 text-emerald-700"
                      : tile.badge === "Premium" ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"}`}>
                      {tile.badge}
                    </span>
                  )}
                </div>
                {isActive && <svg className="w-4 h-4 text-[#2563eb] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
              </button>
            );
          })}
        </div>

        {/* Applied summary */}
        {(wallApplied || floorApplied) && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-1.5">
            {floorApplied && floorTile && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#2563eb] flex-shrink-0" />
                <span className="font-semibold text-gray-600">Floor:</span>
                <span className="truncate text-gray-800">{floorTile.name}</span>
                <button onClick={() => { setFloorTile(null); setFloorApplied(false); }} className="ml-auto text-gray-400 hover:text-red-500">×</button>
              </div>
            )}
            {wallApplied && wallTile && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#2563eb] flex-shrink-0" />
                <span className="font-semibold text-gray-600">Wall:</span>
                <span className="truncate text-gray-800">{wallTile.name}</span>
                <button onClick={() => { setWallTile(null); setWallApplied(false); }} className="ml-auto text-gray-400 hover:text-red-500">×</button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ══════════ CENTER — CANVAS ROOM ══════════ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f0ede8]">

        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
            </svg>
          </button>
          <span className="text-sm font-bold text-[#0f1117]">Tile Visualizer</span>
        </div>

        {/* Canvas room — fills all remaining space */}
        <div className="flex-1 relative overflow-hidden">
          <RoomCanvas
            scene={scene}
            floorTile={floorTile}
            wallTile={wallTile}
            floorApplied={floorApplied}
            wallApplied={wallApplied}
            layout={layout}
            groutColor={groutColor}
            groutWidth={groutWidth}
            surface={surface}
            onFloorClear={() => { setFloorTile(null); setFloorApplied(false); }}
            onWallClear={() => { setWallTile(null); setWallApplied(false); }}
          />
        </div>

        {/* ── KILN-style "Now viewing" strip ─────────────────────────── */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {activeTile ? (
              <>
                <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded border border-gray-100">
                  <Image src={activeTile.image} alt={activeTile.name} fill className="object-cover" sizes="40px" unoptimized={activeTile.image.startsWith("data:") || activeTile.image.startsWith("/uploads/")} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Now viewing</p>
                  <p className="text-sm font-bold text-[#0f1117] truncate">{activeTile.name}</p>
                  <p className="text-xs text-gray-400">{activeTile.sizes} · {activeTile.categoryLabel}</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Now viewing</p>
                <p className="text-sm text-gray-400 italic">—</p>
              </div>
            )}
          </div>

          {/* Bottom-right toolbar */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Scene picker */}
            <div className="relative">
              <button onClick={() => { setSceneOpen(v => !v); setGroutOpen(false); setLayoutOpen(false); setAppliedOpen(false); }}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
                {scene.label}
              </button>
              {sceneOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl overflow-hidden flex border border-gray-100">
                  {ROOM_SCENES.map((r) => (
                    <button key={r.id} onClick={() => { setScene(r); setSceneOpen(false); }}
                      className={`relative flex-shrink-0 overflow-hidden transition-all ${scene.id === r.id ? "ring-2 ring-[#2563eb]" : "opacity-60 hover:opacity-100"}`}
                      style={{ width: 64, height: 48 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url} alt={r.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5">
                        <span className="block text-white text-[7px] font-bold text-center uppercase tracking-wide">{r.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset */}
            <button onClick={reset}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
              Reset
            </button>

            {/* Grout */}
            <div className="relative">
              <button onClick={() => { setGroutOpen(v => !v); setLayoutOpen(false); setAppliedOpen(false); setSceneOpen(false); }}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all">
                <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" style={{ background: groutColor }} />
                Grout
              </button>
              {groutOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl p-3 min-w-[180px] border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Grout Color</p>
                  <div className="flex gap-2 mb-3">
                    {GROUT_SWATCHES.map((s) => (
                      <button key={s.value} onClick={() => setGroutColor(s.value)} title={s.label}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${groutColor === s.value ? "border-[#2563eb] scale-110" : "border-gray-200 hover:border-gray-400"}`}
                        style={{ background: s.value }} />
                    ))}
                    <label className="w-6 h-6 rounded-full border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-gray-400 relative">
                      <input type="color" value={groutColor} onChange={(e) => setGroutColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      <div className="w-full h-full" style={{ background: groutColor }} />
                    </label>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Grout Width</p>
                  <div className="flex gap-1.5">
                    {(["small","medium","large"] as GroutWidth[]).map((w) => (
                      <button key={w} onClick={() => setGroutWidth(w)}
                        className={`flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all ${groutWidth === w ? "bg-[#2563eb] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Layout */}
            <div className="relative">
              <button onClick={() => { setLayoutOpen(v => !v); setGroutOpen(false); setAppliedOpen(false); setSceneOpen(false); }}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="0.5"/><rect x="14" y="3" width="7" height="7" rx="0.5"/><rect x="3" y="14" width="7" height="7" rx="0.5"/><rect x="14" y="14" width="7" height="7" rx="0.5"/></svg>
                Layout
              </button>
              {layoutOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl p-3 min-w-[160px] border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Tile Layout</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { key: "straight",    label: "Straight" },
                      { key: "brick",       label: "Brick" },
                      { key: "herringbone", label: "Herringbone" },
                      { key: "stack",       label: "Stack" },
                    ] as { key: TileLayout; label: string }[]).map((opt) => (
                      <button key={opt.key} onClick={() => { setLayout(opt.key); setLayoutOpen(false); }}
                        className={`py-1.5 text-[10px] font-bold uppercase rounded transition-all ${layout === opt.key ? "bg-[#2563eb] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Applied products */}
            <div className="relative">
              <button onClick={() => { setAppliedOpen(v => !v); setGroutOpen(false); setLayoutOpen(false); setSceneOpen(false); }}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"/></svg>
                Applied
                {(floorApplied || wallApplied) && (
                  <span className="w-4 h-4 rounded-full bg-[#2563eb] text-white text-[9px] font-bold flex items-center justify-center">
                    {(floorApplied ? 1 : 0) + (wallApplied ? 1 : 0)}
                  </span>
                )}
              </button>
              {appliedOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl p-3 min-w-[220px] border border-gray-100 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Applied Products</p>
                  {!floorApplied && !wallApplied && <p className="text-xs text-gray-400 italic">No tiles applied yet</p>}
                  {floorApplied && floorTile && (
                    <div className="flex items-center gap-2">
                      <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded border border-gray-100">
                        <Image src={floorTile.image} alt={floorTile.name} fill className="object-cover" sizes="40px" unoptimized={floorTile.image.startsWith("data:") || floorTile.image.startsWith("/uploads/")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{floorTile.name}</p>
                        <p className="text-[10px] text-gray-400">Floor · {floorTile.sizes}</p>
                      </div>
                      <button onClick={() => { setFloorTile(null); setFloorApplied(false); }} className="text-gray-300 hover:text-red-500 text-sm">×</button>
                    </div>
                  )}
                  {wallApplied && wallTile && (
                    <div className="flex items-center gap-2">
                      <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded border border-gray-100">
                        <Image src={wallTile.image} alt={wallTile.name} fill className="object-cover" sizes="40px" unoptimized={wallTile.image.startsWith("data:") || wallTile.image.startsWith("/uploads/")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{wallTile.name}</p>
                        <p className="text-[10px] text-gray-400">Wall · {wallTile.sizes}</p>
                      </div>
                      <button onClick={() => { setWallTile(null); setWallApplied(false); }} className="text-gray-300 hover:text-red-500 text-sm">×</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

