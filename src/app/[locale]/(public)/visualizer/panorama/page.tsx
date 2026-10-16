"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, type Product, type Collection } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type LayoutMode = "straight" | "brick" | "herringbone";
type SurfaceTab = "floor" | "wall";
type FilterCat = "all" | "floor" | "wall" | "outdoor" | "special";

// A zone is a quadrilateral region on the room photo where tiles get rendered.
// Points are in pixel coordinates RELATIVE to the room image at its natural size.
// We use a 1600×1067 reference coordinate system (standard 3:2 photo).
interface Zone {
  id: string;
  label: "Floor" | "Wall";
  // Four corners: top-left, top-right, bottom-right, bottom-left (clockwise)
  quad: [[number, number], [number, number], [number, number], [number, number]];
  // Where to place the floating badge (% of canvas)
  badge: [number, number];
}

interface RoomScene {
  id: string;
  label: string;
  thumb: string;
  src: string;
  // Natural dimensions of the reference image used to define zone quads
  refW: number;
  refH: number;
  zones: Zone[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Room scenes — zones are hand-mapped quads in reference pixel space.
// All images are from Unsplash (already whitelisted) at 1600px wide.
// ─────────────────────────────────────────────────────────────────────────────

// Reference size: 1600 × 1067  (standard 3:2 Unsplash photo)
const W = 1600, H = 1067;

const SCENES: RoomScene[] = [
  {
    id: "living",
    label: "Living Room",
    thumb: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=320&q=60",
    src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=90",
    refW: W, refH: H,
    zones: [
      {
        id: "floor", label: "Floor",
        // Floor: perspective quad — narrow at horizon, wide at bottom
        quad: [[0, 620], [1600, 620], [1600, 1067], [0, 1067]],
        badge: [50, 82],
      },
      {
        id: "wall", label: "Wall",
        // Back wall above the floor line
        quad: [[0, 0], [1600, 0], [1600, 618], [0, 618]],
        badge: [75, 20],
      },
    ],
  },
  {
    id: "bathroom",
    label: "Bathroom",
    thumb: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=320&q=60",
    src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=90",
    refW: W, refH: H,
    zones: [
      {
        id: "floor", label: "Floor",
        quad: [[0, 670], [1600, 670], [1600, 1067], [0, 1067]],
        badge: [50, 87],
      },
      {
        id: "wall", label: "Wall",
        quad: [[0, 0], [1600, 0], [1600, 668], [0, 668]],
        badge: [75, 22],
      },
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen",
    thumb: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=320&q=60",
    src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=90",
    refW: W, refH: H,
    zones: [
      {
        id: "floor", label: "Floor",
        quad: [[0, 680], [1600, 680], [1600, 1067], [0, 1067]],
        badge: [50, 87],
      },
      {
        id: "wall", label: "Wall",
        quad: [[0, 0], [1600, 0], [1600, 678], [0, 678]],
        badge: [75, 22],
      },
    ],
  },
  {
    id: "lobby",
    label: "Hotel Lobby",
    thumb: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=320&q=60",
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=90",
    refW: W, refH: H,
    zones: [
      {
        id: "floor", label: "Floor",
        quad: [[0, 560], [1600, 560], [1600, 1067], [0, 1067]],
        badge: [50, 80],
      },
      {
        id: "wall", label: "Wall",
        quad: [[220, 0], [1380, 0], [1380, 558], [220, 558]],
        badge: [50, 22],
      },
    ],
  },
  {
    id: "office",
    label: "Office",
    thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=320&q=60",
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=90",
    refW: W, refH: H,
    zones: [
      {
        id: "floor", label: "Floor",
        quad: [[0, 640], [1600, 640], [1600, 1067], [0, 1067]],
        badge: [50, 83],
      },
      {
        id: "wall", label: "Wall",
        quad: [[150, 0], [1450, 0], [1450, 638], [150, 638]],
        badge: [50, 22],
      },
    ],
  },
  {
    id: "outdoor",
    label: "Terrace",
    thumb: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=320&q=60",
    src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1600&q=90",
    refW: W, refH: H,
    zones: [
      {
        id: "floor", label: "Floor",
        quad: [[0, 560], [1600, 560], [1600, 1067], [0, 1067]],
        badge: [50, 80],
      },
      {
        id: "wall", label: "Wall",
        quad: [[0, 0], [1600, 0], [1600, 558], [0, 558]],
        badge: [75, 22],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Grout presets & layout options
// ─────────────────────────────────────────────────────────────────────────────

const GROUT_PRESETS = [
  { label: "White", value: "#f8f8f8" },
  { label: "Sand", value: "#d4c5a9" },
  { label: "Grey", value: "#9ca3af" },
  { label: "Dark", value: "#4b5563" },
  { label: "Black", value: "#111827" },
];

const LAYOUT_OPTS: { key: LayoutMode; label: string }[] = [
  { key: "straight", label: "Straight" },
  { key: "brick", label: "Brick / Offset" },
  { key: "herringbone", label: "Herringbone" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Canvas rendering engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw a perspective-correct tile pattern into a quadrilateral region on canvas.
 *
 * Approach:
 *   1. Draw the tile pattern into an offscreen canvas (infinite repeat).
 *   2. Set the clip region on the main canvas to the quad polygon.
 *   3. Fill the clipped region by drawing the offscreen canvas as a
 *      repeating pattern — this gives correct tile tiling.
 *   4. Add grout lines using the same clip + line drawing.
 *
 * This is the same technique used by professional tile visualizers:
 * the tile image repeats across the surface, clipped to the zone polygon.
 */
function drawTileZone(
  ctx: CanvasRenderingContext2D,
  tileImg: HTMLImageElement,
  quad: [[number, number], [number, number], [number, number], [number, number]],
  scaleX: number,   // canvas px per reference px
  scaleY: number,
  tileSize: number,   // logical tile size in canvas pixels
  groutPx: number,
  groutColor: string,
  layout: LayoutMode,
  opacity: number,
) {
  // Scale quad to canvas coordinates
  const pts = quad.map(([x, y]) => [x * scaleX, y * scaleY] as [number, number]);

  // Build offscreen tile pattern
  const step = tileSize + groutPx;
  const offSize = step * 4; // 4×4 tile grid in the offscreen canvas
  const off = document.createElement("canvas");
  off.width = offSize;
  off.height = layout === "herringbone" ? offSize * 2 : offSize;
  const octx = off.getContext("2d")!;

  if (layout === "straight" || layout === "brick") {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const offset = layout === "brick" && row % 2 === 1 ? step * 0.5 : 0;
        const dx = col * step + offset;
        const dy = row * step;
        octx.drawImage(tileImg, dx, dy, tileSize, tileSize);
        // Grout
        if (groutPx > 0) {
          octx.fillStyle = groutColor;
          // right grout
          octx.fillRect(dx + tileSize, dy, groutPx, tileSize);
          // bottom grout
          octx.fillRect(dx, dy + tileSize, tileSize, groutPx);
        }
      }
    }
  } else {
    // herringbone — two orientations interleaved
    const ht = tileSize, hw = tileSize * 2;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const dx = col * (hw + groutPx);
        const dy = row * (ht + groutPx);
        // horizontal tile
        octx.drawImage(tileImg, dx, dy, hw, ht);
        if (groutPx > 0) {
          octx.fillStyle = groutColor;
          octx.fillRect(dx, dy + ht, hw, groutPx);
          octx.fillRect(dx + hw, dy, groutPx, ht);
        }
        // vertical tile below-right
        const vx = dx + hw + groutPx;
        const vy = dy;
        if (vx < offSize) {
          octx.save();
          octx.translate(vx + ht * 0.5, vy + hw * 0.5);
          octx.rotate(Math.PI / 2);
          octx.drawImage(tileImg, -ht * 0.5, -hw * 0.5, hw, ht);
          octx.restore();
          if (groutPx > 0) {
            octx.fillStyle = groutColor;
            octx.fillRect(vx + ht, vy, groutPx, hw);
            octx.fillRect(vx, vy + hw, ht, groutPx);
          }
        }
      }
    }
  }

  // Build a repeating pattern from the offscreen canvas
  const pattern = ctx.createPattern(off, "repeat");
  if (!pattern) return;

  // Clip to the quadrilateral
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  ctx.lineTo(pts[1][0], pts[1][1]);
  ctx.lineTo(pts[2][0], pts[2][1]);
  ctx.lineTo(pts[3][0], pts[3][1]);
  ctx.closePath();
  ctx.clip();

  // Fill with the pattern using "overlay" composite to blend with photo
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Second pass at normal for colour fidelity
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// The canvas visualizer component
// ─────────────────────────────────────────────────────────────────────────────

interface VisualizerCanvasProps {
  scene: RoomScene;
  wallTile: Product | null;
  floorTile: Product | null;
  groutColor: string;
  groutPx: number;
  tileSize: number;
  layout: LayoutMode;
  activeZone: string;
  onZoneClick: (id: string) => void;
}

function VisualizerCanvas({
  scene, wallTile, floorTile, groutColor, groutPx, tileSize,
  layout, activeZone, onZoneClick,
}: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const roomImgRef = useRef<HTMLImageElement | null>(null);
  const tileImgs = useRef<Map<string, HTMLImageElement>>(new Map());
  const animRef = useRef<number>(0);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Track wrapper size
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pre-load an image and return it (cached)
  const loadImg = useCallback((src: string): Promise<HTMLImageElement> => {
    const cached = tileImgs.current.get(src);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { tileImgs.current.set(src, img); resolve(img); };
      img.onerror = () => resolve(img); // resolve even on error
      img.src = src;
    });
  }, []);

  // Main render function
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;

    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- 1. Draw room photo ---
    if (!roomImgRef.current || roomImgRef.current.dataset.src !== scene.src) {
      const img = await loadImg(scene.src);
      img.dataset.src = scene.src;
      roomImgRef.current = img;
    }
    const rImg = roomImgRef.current;
    if (rImg.naturalWidth === 0) return;

    // Cover-fit the image
    const imgAr = rImg.naturalWidth / rImg.naturalHeight;
    const canAr = size.w / size.h;
    let dw: number, dh: number, dx: number, dy: number;
    if (imgAr > canAr) {
      dh = size.h; dw = dh * imgAr;
      dx = (size.w - dw) / 2; dy = 0;
    } else {
      dw = size.w; dh = dw / imgAr;
      dx = 0; dy = (size.h - dh) / 2;
    }
    ctx.drawImage(rImg, dx, dy, dw, dh);

    // Scale from reference coord space to actual canvas draw space
    const scaleX = dw / scene.refW;
    const scaleY = dh / scene.refH;
    const offX = dx;
    const offY = dy;

    // Helper: shift a quad by the cover-fit offset
    const shiftQuad = (quad: Zone["quad"]) =>
      quad.map(([x, y]) => [x * scaleX + offX, y * scaleY + offY]) as Zone["quad"];

    // --- 2. Draw tile overlays ---
    const tilePx = tileSize; // already in canvas px

    for (const zone of scene.zones) {
      const tile = zone.label === "Floor" ? floorTile : wallTile;
      if (!tile) continue;

      const img = await loadImg(tile.image);
      if (img.naturalWidth === 0) continue;

      const shifted = shiftQuad(zone.quad);

      // We need scaleX/scaleY relative to the offscreen pattern context,
      // so pass 1,1 (offscreen canvas already in canvas px)
      drawTileZone(ctx, img, shifted, 1, 1, tilePx, groutPx, groutColor, layout, 1);
    }

    // --- 3. Active zone highlight ---
    for (const zone of scene.zones) {
      if (zone.id !== activeZone) continue;
      const pts = shiftQuad(zone.quad);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.lineTo(pts[3][0], pts[3][1]);
      ctx.closePath();
      ctx.strokeStyle = "rgba(201,168,76,0.8)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = "rgba(201,168,76,1)";
      ctx.fill();
      ctx.restore();
    }
  }, [scene, wallTile, floorTile, groutColor, groutPx, tileSize, layout, activeZone, size, loadImg]);

  // Re-render whenever inputs change
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(() => { render(); });
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  // Click detection — map canvas click to zone
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Recalculate cover-fit offset
    const roomImg = roomImgRef.current;
    if (!roomImg || roomImg.naturalWidth === 0) return;
    const imgAr = roomImg.naturalWidth / roomImg.naturalHeight;
    const canAr = size.w / size.h;
    let dw: number, dh: number, dx: number, dy: number;
    if (imgAr > canAr) {
      dh = size.h; dw = dh * imgAr; dx = (size.w - dw) / 2; dy = 0;
    } else {
      dw = size.w; dh = dw / imgAr; dx = 0; dy = (size.h - dh) / 2;
    }
    const scaleX = dw / scene.refW;
    const scaleY = dh / scene.refH;

    for (const zone of scene.zones) {
      const pts = zone.quad.map(([x, y]) => [x * scaleX + dx, y * scaleY + dy] as [number, number]);
      if (pointInQuad(cx, cy, pts as [[number, number], [number, number], [number, number], [number, number]])) {
        onZoneClick(zone.id);
        return;
      }
    }
  }, [scene, size, onZoneClick]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
      />
      {/* Floating zone badges — positioned via % */}
      {scene.zones.map((zone) => {
        const tile = zone.label === "Floor" ? floorTile : wallTile;
        const isActive = activeZone === zone.id;
        const [bx, by] = zone.badge;
        return (
          <button
            key={zone.id}
            onClick={() => onZoneClick(zone.id)}
            className={`
              absolute z-10 flex items-center gap-1.5 py-1 px-3 text-xs font-bold
              shadow-md transition-all duration-150 select-none
              ${isActive
                ? "bg-primary  shadow-primary/50"
                : "/90  hover:bg-primary "
              }
            `}
            style={{ left: `${bx}%`, top: `${by}%`, transform: "translate(-50%,-50%)" }}
          >
            {zone.label === "Floor" ? (
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 21V9l9-6 9 6v12" />
              </svg>
            ) : (
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <rect x="2" y="3" width="20" height="14" rx="1" />
                <path d="M2 9h20M9 3v14M15 3v14" strokeWidth={1.5} />
              </svg>
            )}
            {zone.label}
            <svg className="w-2.5 h-2.5 opacity-50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v5.5m0-5.5h5.5m9.5 0h-5.5m5.5 0v5.5M3.75 20.25v-5.5m0 5.5h5.5m9.5 0h-5.5m5.5 0v-5.5" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

// Point-in-quad using cross-product winding test
function pointInQuad(
  px: number, py: number,
  q: [[number, number], [number, number], [number, number], [number, number]]
): boolean {
  const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const signs = [
    cross(q[0][0], q[0][1], q[1][0], q[1][1], px, py),
    cross(q[1][0], q[1][1], q[2][0], q[2][1], px, py),
    cross(q[2][0], q[2][1], q[3][0], q[3][1], px, py),
    cross(q[3][0], q[3][1], q[0][0], q[0][1], px, py),
  ];
  return signs.every(s => s >= 0) || signs.every(s => s <= 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tile sidebar list item
// ─────────────────────────────────────────────────────────────────────────────

function TileRow({ tile, active, onApply }: { tile: Product; active: boolean; onApply: () => void }) {
  return (
    <button
      onClick={onApply}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 -b  group
        ${active ? "bg-[#fdf6e3] -l-[3px] -l-primary" : " hover:bg-muted -l-[3px] -l-transparent"}`}
    >
      {/* Swatch */}
      <div className={`relative w-11 h-11 flex-shrink-0 overflow-hidden -2 ${active ? "-primary" : "-gray-200 group-hover:-gray-300"}`}>
        <Image src={tile.image} alt={tile.name} fill className="object-cover" sizes="44px" unoptimized />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`w-3 h-3 rounded-full -2 flex-shrink-0 ${active ? "bg-primary -primary" : " -gray-300"}`} />
          <p className="text-[11px] font-bold  truncate leading-tight">{tile.name}</p>
        </div>
        <p className="text-[9px]  leading-tight ml-4 truncate">{tile.categoryLabel}</p>
        <p className="text-[9px]  leading-tight ml-4 truncate">{tile.sizes || "Various sizes"} · {tile.badge ? <span className=" font-bold">{tile.badge}</span> : "Matt"}</p>
      </div>
      {/* Bookmark */}
      <svg className="w-4 h-4 text-ivory/70 group-hover: flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    </button>
  );
}

// Tile grid card
function TileCard({ tile, active, onApply }: { tile: Product; active: boolean; onApply: () => void }) {
  return (
    <button
      onClick={onApply}
      className={`relative overflow-hidden transition-all group ${active ? "ring-2 ring-primary" : "ring-1 ring-ring hover:ring-primary/60"}`}
    >
      <div className="relative w-full aspect-square">
        <Image src={tile.image} alt={tile.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="110px" unoptimized />
        {active && (
          <div className="absolute inset-0 bg-primary/25 flex items-center justify-center">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
          </div>
        )}
        {tile.badge && (
          <span className="absolute top-1 left-1 text-[7px] font-bold px-1.5 py-0.5 bg-primary  uppercase tracking-wide">{tile.badge}</span>
        )}
      </div>
      <div className="p-1.5 ">
        <p className="text-[9px] font-bold  truncate">{tile.name}</p>
        <p className="text-[8px]  truncate">{tile.categoryLabel}</p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

function PanoramaInner() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [mounted, setMounted] = useState(false);

  const [scene, setScene] = useState<RoomScene>(SCENES[0]);
  const [wallTile, setWallTile] = useState<Product | null>(null);
  const [floorTile, setFloorTile] = useState<Product | null>(null);
  const [activeZone, setActiveZone] = useState<string>("floor");
  const [surfaceTab, setSurfaceTab] = useState<SurfaceTab>("floor");
  const [activeCol, setActiveCol] = useState<Collection | null>(null);

  const [groutColor, setGroutColor] = useState("#9ca3af");
  const [groutPx, setGroutPx] = useState(3);
  const [tileSize, setTileSize] = useState(100);
  const [layout, setLayout] = useState<LayoutMode>("straight");

  const [filterCat, setFilterCat] = useState<FilterCat>("all");
  const [listMode, setListMode] = useState<"list" | "grid">("list");
  const [searchQ, setSearchQ] = useState("");
  const [showGrout, setShowGrout] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const [showApplied, setShowApplied] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2500);
  };

  // ── Load data
  useEffect(() => {
    setMounted(true);
    Promise.all([api.getProducts(), api.getCollections()])
      .then(([prods, cols]) => {
        setProducts(prods);
        setCollections(cols);
        const colParam = searchParams.get("collection");
        const tileParam = searchParams.get("tile");
        const roomParam = searchParams.get("room");
        if (roomParam) {
          const r = SCENES.find(s => s.id === roomParam);
          if (r) setScene(r);
        }
        if (colParam) {
          const col = cols.find(c => c.name === colParam);
          if (col) {
            setActiveCol(col);
            const ct = prods.filter(p => col.tileIds.includes(p.id));
            const wt = ct.find(p => p.category === "wall" || p.category === "special");
            const ft = ct.find(p => p.category === "floor" || p.category === "outdoor");
            if (wt) setWallTile(wt);
            if (ft) setFloorTile(ft);
            if (ft) { setActiveZone("floor"); setSurfaceTab("floor"); }
            else if (wt) { setActiveZone("wall"); setSurfaceTab("wall"); }
          }
        } else if (tileParam) {
          const tile = prods.find(p => p.id === Number(tileParam));
          if (tile) {
            if (tile.category === "wall" || tile.category === "special") {
              setWallTile(tile); setActiveZone("wall"); setSurfaceTab("wall");
            } else {
              setFloorTile(tile); setActiveZone("floor"); setSurfaceTab("floor");
            }
          }
        }
      }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleZoneClick = (id: string) => {
    setActiveZone(id);
    setSurfaceTab(id === "floor" ? "floor" : "wall");
  };

  const handleApplyTile = (tile: Product) => {
    if (activeZone === "floor") {
      setFloorTile(tile); showToast(`${tile.name} → Floor`);
    } else {
      setWallTile(tile); showToast(`${tile.name} → Wall`);
    }
  };

  // Filtered tile list — respects surface tab (floor tiles on Floor, wall on Wall)
  const visibleTiles = products.filter(p => {
    const byCol = activeCol ? activeCol.tileIds.includes(p.id) : true;
    const bySurf = surfaceTab === "floor"
      ? (p.category === "floor" || p.category === "outdoor")
      : (p.category === "wall" || p.category === "special");
    const byCat = filterCat === "all" || p.category === filterCat;
    const bySearch = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase());
    return byCol && bySurf && byCat && bySearch;
  });

  if (!mounted) return (
    <div className="h-screen bg-[#f4f6f8] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 -2 -primary -t-transparent rounded-full animate-spin" />
        <span className=" text-sm tracking-wide">Loading visualizer…</span>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#f0f2f5] flex flex-col overflow-hidden">

      {/* ═══════════════════════ TOP BAR ═══════════════════════════ */}
      <header className="flex-shrink-0 h-12  -b -gray-200 flex items-center px-3 gap-2 z-30 shadow-sm">

        {/* Back / Logo */}
        <Link href="/collections" className="flex items-center gap-2 mr-1 flex-shrink-0 group">
          <svg className="w-4 h-4  group-hover: transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <div className="relative w-6 h-6 flex-shrink-0">
            <Image unoptimized src="/LOGO MOUNTAIN.png" alt="MCC" fill className="object-contain" sizes="24px" />
          </div>
          <span className=" text-xs font-bold hidden sm:block tracking-wide">MCC Visualizer</span>
        </Link>

        <div className="w-px h-5  flex-shrink-0" />

        {/* Wall / Floor toggle — blue pills like the reference */}
        <div className="flex items-center  rounded-sm p-0.5 gap-0.5 flex-shrink-0">
          <button
            onClick={() => { setSurfaceTab("wall"); setActiveZone("wall"); }}
            className={`px-4 py-1.5 text-xs font-bold tracking-wide rounded-sm transition-all ${surfaceTab === "wall"
              ? "bg-[#1a73e8]  shadow-sm"
              : " hover:text-foreground"
              }`}
          >
            Wall
          </button>
          <button
            onClick={() => { setSurfaceTab("floor"); setActiveZone("floor"); }}
            className={`px-4 py-1.5 text-xs font-bold tracking-wide rounded-sm transition-all ${surfaceTab === "floor"
              ? "bg-[#1a73e8]  shadow-sm"
              : " hover:text-foreground"
              }`}
          >
            Floor
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-[220px]">
          <input
            type="text"
            placeholder="Search tiles…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs  -0 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1a73e8] placeholder-muted-foreground"
          />
          <svg className="absolute left-2 top-2 w-3.5 h-3.5 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>

        {/* List / Grid toggle */}
        <div className="flex gap-0.5 flex-shrink-0">
          <button onClick={() => setListMode("list")} className={`p-1.5 rounded-sm transition-colors ${listMode === "list" ? " " : " hover:"}`} title="List view">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" /></svg>
          </button>
          <button onClick={() => setListMode("grid")} className={`p-1.5 rounded-sm transition-colors ${listMode === "grid" ? " " : " hover:"}`} title="Grid view">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="0.5" /><rect x="14" y="3" width="7" height="7" rx="0.5" /><rect x="3" y="14" width="7" height="7" rx="0.5" /><rect x="14" y="14" width="7" height="7" rx="0.5" /></svg>
          </button>
        </div>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowRooms(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold  hover: px-3 py-1.5  -gray-200 hover:-gray-400  transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="hidden md:block">Change Room</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold  hover: px-3 py-1.5  -gray-200 hover:-gray-400  transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden md:block">Download</span>
          </button>
        </div>
      </header>

      {/* ════════════════ BODY ════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-[220px] sm:w-[250px]  -r -gray-200 flex flex-col overflow-hidden flex-shrink-0 shadow-sm">

          {/* Collection dropdown */}
          <div className="px-3 py-2 -b  flex-shrink-0">
            <div className="relative">
              <select
                value={activeCol?.name ?? ""}
                onChange={e => setActiveCol(collections.find(c => c.name === e.target.value) ?? null)}
                className="w-full text-[10px] font-semibold text-foreground bg-muted  -gray-200 py-1.5 pl-2 pr-6 appearance-none focus:outline-none focus:-primary"
              >
                <option value="">— All products —</option>
                {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <svg className="absolute right-2 top-2 w-3 h-3  pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>

          {/* Sort label (cosmetic like ref) */}
          <div className="flex items-center justify-between px-3 py-1.5 -b  flex-shrink-0">
            <span className="text-[9px]  font-bold uppercase tracking-widest">
              {visibleTiles.length} product{visibleTiles.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-1">
              {(["all", "floor", "wall"] as FilterCat[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`text-[8px] font-bold uppercase px-1.5 py-0.5 transition-all ${filterCat === cat ? "bg-[#1a73e8] " : "  hover:"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tile list */}
          <div className="flex-1 overflow-y-auto">
            {visibleTiles.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs ">No tiles match your filters.</p>
                <button onClick={() => { setFilterCat("all"); setSearchQ(""); }} className="text-[10px] text-[#1a73e8] mt-2 hover:underline">Clear filters</button>
              </div>
            ) : listMode === "list" ? (
              visibleTiles.map(tile => {
                const active = activeZone === "floor" ? floorTile?.id === tile.id : wallTile?.id === tile.id;
                return <TileRow key={tile.id} tile={tile} active={active} onApply={() => handleApplyTile(tile)} />;
              })
            ) : (
              <div className="grid grid-cols-2 gap-1.5 p-2">
                {visibleTiles.map(tile => {
                  const active = activeZone === "floor" ? floorTile?.id === tile.id : wallTile?.id === tile.id;
                  return <TileCard key={tile.id} tile={tile} active={active} onApply={() => handleApplyTile(tile)} />;
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── CANVAS AREA ── */}
        <main className="flex-1 relative overflow-hidden bg-[#1a1a1a]">
          <VisualizerCanvas
            scene={scene}
            wallTile={wallTile}
            floorTile={floorTile}
            groutColor={groutColor}
            groutPx={groutPx}
            tileSize={tileSize}
            layout={layout}
            activeZone={activeZone}
            onZoneClick={handleZoneClick}
          />

          {/* Room picker overlay */}
          {showRooms && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 /95 backdrop-blur-sm  -gray-200 shadow-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold  uppercase tracking-widest">Choose Room Scene</span>
                <button onClick={() => setShowRooms(false)} className=" hover:text-foreground text-sm w-5 h-5 flex items-center justify-center">×</button>
              </div>
              <div className="flex gap-2">
                {SCENES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setScene(s); setWallTile(null); setFloorTile(null); setShowRooms(false); }}
                    className={`relative flex-shrink-0 overflow-hidden transition-all ${scene.id === s.id ? "ring-2 ring-primary" : "ring-1 ring-ring opacity-70 hover:opacity-100"}`}
                    style={{ width: 80, height: 56 }}
                  >
                    <Image src={s.thumb} alt={s.label} fill className="object-cover" sizes="80px" unoptimized />
                    <div className="absolute inset-0 bg-black/30 flex items-end p-1">
                      <span className=" text-[8px] font-bold">{s.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Applied tile watermark (bottom-left like reference) */}
          {(wallTile || floorTile) && (
            <div className="absolute bottom-14 left-4 z-10 pointer-events-none">
              <div className="flex flex-col gap-1">
                {floorTile && (
                  <div className="flex items-center gap-2 /85 backdrop-blur-sm px-2.5 py-1.5 -l-2 -l-primary shadow-sm">
                    <div className="relative w-7 h-7 flex-shrink-0 overflow-hidden  -gray-200">
                      <Image src={floorTile.image} alt="" fill className="object-cover" sizes="28px" unoptimized />
                    </div>
                    <div>
                      <p className="text-[8px]  font-bold uppercase tracking-wider">Floor</p>
                      <p className="text-[10px] font-bold ">{floorTile.name}</p>
                    </div>
                  </div>
                )}
                {wallTile && (
                  <div className="flex items-center gap-2 /85 backdrop-blur-sm px-2.5 py-1.5 -l-2 -l-[#1a73e8] shadow-sm">
                    <div className="relative w-7 h-7 flex-shrink-0 overflow-hidden  -gray-200">
                      <Image src={wallTile.image} alt="" fill className="object-cover" sizes="28px" unoptimized />
                    </div>
                    <div>
                      <p className="text-[8px]  font-bold uppercase tracking-wider">Wall</p>
                      <p className="text-[10px] font-bold ">{wallTile.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ═══════════════════════ BOTTOM TOOLBAR ════════════════════ */}
      <footer className="flex-shrink-0 h-11  -t -gray-200 flex items-center px-4 gap-1 z-30 shadow-sm">

        {/* Reset */}
        <button
          onClick={() => { setWallTile(null); setFloorTile(null); showToast("Reset"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold  hover:  -gray-200 hover:-gray-400  transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Reset
        </button>

        <div className="w-px h-5  mx-0.5" />

        {/* Grout */}
        <div className="relative">
          <button
            onClick={() => { setShowGrout(v => !v); setShowLayout(false); setShowApplied(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold  transition-colors ${showGrout ? "-primary  bg-primary/5" : "-gray-200  hover: hover:-gray-400 "}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Grout
          </button>
          {showGrout && (
            <div className="absolute bottom-12 left-0   -gray-200 shadow-2xl p-4 w-72 z-40">
              <p className="text-[10px] font-bold  uppercase tracking-widest mb-3">Grout Color</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {GROUT_PRESETS.map(p => (
                  <button key={p.value} onClick={() => setGroutColor(p.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold  transition-all ${groutColor === p.value ? "-primary bg-primary/10 " : "-gray-200  hover:-gray-400"}`}>
                    <span className="w-3.5 h-3.5 rounded-full  -gray-300 flex-shrink-0" style={{ background: p.value }} />
                    {p.label}
                  </button>
                ))}
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold  -gray-200  hover:-gray-400 cursor-pointer">
                  <input type="color" value={groutColor} onChange={e => setGroutColor(e.target.value)} className="w-3.5 h-3.5 -0 bg-transparent cursor-pointer" />
                  Custom
                </label>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold  uppercase tracking-widest mb-1.5">
                    Grout Width <span className=" normal-case">{groutPx}px</span>
                  </p>
                  <input type="range" min={1} max={12} value={groutPx} onChange={e => setGroutPx(Number(e.target.value))} className="w-full accent-primary" />
                  <div className="flex justify-between text-[8px]  mt-0.5"><span>Thin</span><span>Thick</span></div>
                </div>
                <div>
                  <p className="text-[10px] font-bold  uppercase tracking-widest mb-1.5">
                    Tile Scale <span className=" normal-case">{tileSize}px</span>
                  </p>
                  <input type="range" min={40} max={220} step={10} value={tileSize} onChange={e => setTileSize(Number(e.target.value))} className="w-full accent-primary" />
                  <div className="flex justify-between text-[8px]  mt-0.5"><span>Small</span><span>Large format</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Layout */}
        <div className="relative">
          <button
            onClick={() => { setShowLayout(v => !v); setShowGrout(false); setShowApplied(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold  transition-colors ${showLayout ? "-primary  bg-primary/5" : "-gray-200  hover: hover:-gray-400 "}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            Layout
          </button>
          {showLayout && (
            <div className="absolute bottom-12 left-0   -gray-200 shadow-2xl p-4 w-52 z-40">
              <p className="text-[10px] font-bold  uppercase tracking-widest mb-3">Tile Layout</p>
              <div className="space-y-1.5">
                {LAYOUT_OPTS.map(opt => (
                  <button key={opt.key} onClick={() => setLayout(opt.key)}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-semibold  transition-all ${layout === opt.key ? "-primary bg-primary/10 " : "-gray-200  hover:-gray-400"}`}>
                    {layout === opt.key && <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Applied Products */}
        <div className="relative">
          <button
            onClick={() => { setShowApplied(v => !v); setShowGrout(false); setShowLayout(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold  transition-colors ${showApplied ? "-primary  bg-primary/5" : "-gray-200  hover: hover:-gray-400 "}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Applied Products
            {(wallTile || floorTile) && (
              <span className="w-4 h-4 bg-primary  text-[9px] font-bold rounded-full flex items-center justify-center">
                {(wallTile ? 1 : 0) + (floorTile ? 1 : 0)}
              </span>
            )}
          </button>
          {showApplied && (
            <div className="absolute bottom-12 left-0   -gray-200 shadow-2xl p-4 w-64 z-40">
              <p className="text-[10px] font-bold  uppercase tracking-widest mb-3">Applied Tiles</p>
              {!wallTile && !floorTile ? (
                <p className="text-xs ">No tiles applied yet.</p>
              ) : (
                <div className="space-y-2">
                  {floorTile && (
                    <div className="flex items-center gap-3 p-2 bg-muted  -gray-200">
                      <div className="relative w-9 h-9 flex-shrink-0 overflow-hidden  -gray-200">
                        <Image src={floorTile.image} alt="" fill className="object-cover" sizes="36px" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px]  font-bold uppercase tracking-wide">Floor</p>
                        <p className="text-[11px] font-bold  truncate">{floorTile.name}</p>
                      </div>
                      <button onClick={() => setFloorTile(null)} className=" hover:text-red-500 transition-colors font-bold text-sm flex-shrink-0">×</button>
                    </div>
                  )}
                  {wallTile && (
                    <div className="flex items-center gap-3 p-2 bg-muted  -gray-200">
                      <div className="relative w-9 h-9 flex-shrink-0 overflow-hidden  -gray-200">
                        <Image src={wallTile.image} alt="" fill className="object-cover" sizes="36px" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px]  font-bold uppercase tracking-wide">Wall</p>
                        <p className="text-[11px] font-bold  truncate">{wallTile.name}</p>
                      </div>
                      <button onClick={() => setWallTile(null)} className=" hover:text-red-500 transition-colors font-bold text-sm flex-shrink-0">×</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />
        <span className="text-[10px]  hidden sm:block font-semibold">{scene.label}</span>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 bg-accent  text-xs font-semibold px-4 py-2 shadow-lg pointer-events-none animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function PanoramaVisualizerPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="w-10 h-10 -2 -primary -t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PanoramaInner />
    </Suspense>
  );
}

