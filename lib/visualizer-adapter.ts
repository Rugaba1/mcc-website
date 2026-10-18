import { type Product, type ProductVariant } from "./api";
import { type TileProduct, type TileSizeOption } from "../data/catalog";
import { ALL_ROOM_SCENES, type SceneDefinition } from "../data/scenes";

/**
 * Derives a standard visualizer aspect ratio from size string (e.g. "60x60" -> "1x1", "30x60" -> "1x2")
 */
export function deriveRatio(sizeStr: string): string {
  const s = sizeStr.toLowerCase().replace(/mm/g, "").replace(/\s+/g, "");
  if (s.includes("mosaic")) return "Mosaic";
  const parts = s.split(/[x×]/);
  if (parts.length === 2) {
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      if (Math.abs(w - h) < 5) return "1x1";
      if (Math.abs(w / h - 2) < 0.2 || Math.abs(h / w - 2) < 0.2) return "1x2";
      if (Math.abs(w / h - 3) < 0.2 || Math.abs(h / w - 3) < 0.2) return "1x3";
      if (Math.abs(w / h - 6) < 0.5 || Math.abs(h / w - 6) < 0.5) return "1x6";
    }
  }
  return "1x1";
}

/**
 * Categorizes a tile into a high-level color bucket for filter chips
 */
export function getColorCategory(name: string, colors?: string[] | string): string {
  let colorsStr = "";
  if (Array.isArray(colors)) {
    colorsStr = colors.join(" ");
  } else if (typeof colors === "string") {
    colorsStr = colors;
  }
  const text = (name + " " + colorsStr).toLowerCase();
  if (text.includes("beige") || text.includes("cream") || text.includes("sand") || text.includes("ivory")) return "Beige";
  if (text.includes("grey") || text.includes("gray") || text.includes("ash") || text.includes("silver") || text.includes("rubino")) return "Grey";
  if (text.includes("white")) return "White";
  if (text.includes("black") || text.includes("dark")) return "Black";
  if (text.includes("brown") || text.includes("wood") || text.includes("oak") || text.includes("teak") || text.includes("tik")) return "Brown";
  if (text.includes("blue") || text.includes("azure")) return "Blue";
  if (text.includes("green") || text.includes("emerald")) return "Green";
  if (text.includes("pink") || text.includes("gold") || text.includes("red")) return "Special";
  return "All Colors";
}

/**
 * Transforms a database Product with ProductVariants into a TileProduct for the Visualizer
 */
export function dbProductToTileProduct(prod: Product): TileProduct {
  const variants = prod.variants && prod.variants.length > 0 ? prod.variants : [];
  const primaryVariant: ProductVariant | undefined = variants[0];

  let parsedColors: string[] = [];
  if (Array.isArray(prod.colors)) {
    parsedColors = prod.colors;
  } else if (typeof prod.colors === "string") {
    try {
      parsedColors = JSON.parse(prod.colors);
    } catch {
      parsedColors = [prod.colors];
    }
  }

  const sizeOptions: TileSizeOption[] = variants.length > 0
    ? variants.map((v) => ({
        id: v.id,
        size: v.size,
        sku: v.sku,
        ratio: deriveRatio(v.size),
        specifier: v.sku,
        swatchUrl: v.image || prod.image,
        pricePerBox: v.pricePerBox,
        pricePerSqm: v.pricePerSqm,
        variantId: v.id,
      }))
    : [
        {
          id: prod.id * 100,
          size: prod.sizes?.split("&")[0]?.split(",")[0]?.trim() || "60x60",
          sku: `MCC-${prod.id}`,
          ratio: "1x1",
          specifier: prod.name,
          swatchUrl: prod.image,
          pricePerBox: 32000,
          pricePerSqm: 22000,
          variantId: prod.id,
        },
      ];

  const activeSize = sizeOptions[0];
  const colorCat = getColorCategory(prod.name, parsedColors);

  return {
    id: prod.id,
    name: prod.name,
    color: parsedColors[0] || prod.name,
    sku: primaryVariant?.sku || `MCC-${prod.id}`,
    specifier: prod.slug || prod.name,
    size: activeSize.size,
    ratio: activeSize.ratio,
    material: prod.material || "Porcelain",
    colorCategory: colorCat,
    swatchUrl: primaryVariant?.image || prod.image,
    pricePerBox: primaryVariant?.pricePerBox || 32000,
    pricePerSqm: primaryVariant?.pricePerSqm || 22000,
    category: prod.category,
    description: prod.description,
    availableSizes: sizeOptions,
  };
}

/**
 * Fetches real products from the database via /api/products and returns visualizer-ready TileProducts
 */
export async function fetchVisualizerTiles(): Promise<TileProduct[]> {
  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }
    const products: Product[] = await res.json();
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }
    return products.map(dbProductToTileProduct);
  } catch (err) {
    console.error("fetchVisualizerTiles error:", err);
    return [];
  }
}

/**
 * Fetches visualizer scenes from /api/visualizer/scenes with fallback to ALL_ROOM_SCENES
 */
export async function fetchVisualizerScenes(): Promise<SceneDefinition[]> {
  try {
    const res = await fetch("/api/visualizer/scenes", { cache: "no-store" });
    if (!res.ok) {
      return ALL_ROOM_SCENES;
    }
    const scenes = await res.json();
    return Array.isArray(scenes) && scenes.length > 0 ? scenes : ALL_ROOM_SCENES;
  } catch (err) {
    console.error("fetchVisualizerScenes error:", err);
    return ALL_ROOM_SCENES;
  }
}

/**
 * Finds a tile in the list by ID, SKU, slug, or name
 */
export function findTileInList(tiles: TileProduct[], query: string): TileProduct | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase().replace(/^\^/, "");

  // 1. Exact numeric ID match
  const numId = Number(clean);
  if (!isNaN(numId)) {
    const byId = tiles.find((t) => t.id === numId);
    if (byId) return byId;
  }

  // 2. Exact or partial SKU match (main SKU or any size variant SKU)
  const bySku = tiles.find(
    (t) =>
      t.sku.toLowerCase() === clean ||
      t.availableSizes.some((s) => s.sku.toLowerCase() === clean)
  );
  if (bySku) return bySku;

  // 3. Exact slug / specifier match
  const bySlug = tiles.find(
    (t) => t.specifier.toLowerCase() === clean || t.specifier.toLowerCase().includes(clean)
  );
  if (bySlug) return bySlug;

  // 4. Name match
  const byName = tiles.find(
    (t) => t.name.toLowerCase() === clean || t.name.toLowerCase().includes(clean)
  );
  if (byName) return byName;

  return undefined;
}
