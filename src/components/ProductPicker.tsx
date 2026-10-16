"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  TILES_CATALOG,
  PAINTS_CATALOG,
  COUNTERS_CATALOG,
  CABINETS_CATALOG,
  GROUT_CATALOG,
  PATTERNS_CATALOG,
  TileProduct,
  TileSizeOption,
  PaintProduct,
  CounterProduct,
  CabinetProduct,
  GroutColor,
  TilePattern,
} from "@/data/catalog";
import { SurfaceDefinition } from "@/data/scenes";
import { SurfaceSelection, AnyProduct } from "@/types/visualizer";
import { Search, Layers, Grid, Palette, RotateCw, Trash2, Check, Ruler, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

interface ProductPickerProps {
  surface: SurfaceDefinition;
  currentSelection: SurfaceSelection | null;
  onApply: (selection: SurfaceSelection) => void;
  onRemove: (sortOrder: number) => void;
  activeSide?: "left" | "right";
  dbTiles?: TileProduct[];
  initialFilter?: string;
}

export const ProductPicker: React.FC<ProductPickerProps> = ({
  surface,
  currentSelection,
  onApply,
  onRemove,
  activeSide,
  dbTiles,
  initialFilter,
}) => {
  const { addToCart } = useCart();
  const [addedToast, setAddedToast] = useState(false);

  const isPaintSurface = surface.category === "Paint" || surface.type === "TRIM" || surface.type === "PAINTED WALL";
  const isCounterSurface = surface.category === "Counter" || surface.type === "COUNTER";
  const isCabinetSurface = surface.category === "Cabinet" || surface.type === "CABINETS";
  const isTileSurface = !isPaintSurface && !isCounterSurface && !isCabinetSurface;

  // Active collection of tiles (prefers database tiles)
  const tileList = dbTiles && dbTiles.length > 0 ? dbTiles : TILES_CATALOG;

  const [activeTab, setActiveTab] = useState<"tile" | "grout" | "pattern">("tile");
  const [searchQuery, setSearchQuery] = useState(initialFilter || "");
  const [selectedColorCategory, setSelectedColorCategory] = useState<string>("All");
  const [selectedTileCategory, setSelectedTileCategory] = useState<string>("All");

  useEffect(() => {
    if (initialFilter) {
      setSearchQuery(initialFilter);
    }
  }, [initialFilter]);

  // Selected state
  const [pickedTile, setPickedTile] = useState<TileProduct>(tileList[0]);
  const [selectedSizeId, setSelectedSizeId] = useState<number>(
    tileList[0].availableSizes?.[0]?.id || tileList[0].id
  );
  const [pickedPaint, setPickedPaint] = useState<PaintProduct>(PAINTS_CATALOG[0]);
  const [pickedCounter, setPickedCounter] = useState<CounterProduct>(COUNTERS_CATALOG[0]);
  const [pickedCabinet, setPickedCabinet] = useState<CabinetProduct>(CABINETS_CATALOG[0]);

  const [pickedGrout, setPickedGrout] = useState<GroutColor>(GROUT_CATALOG[0]);
  const [pickedPattern, setPickedPattern] = useState<TilePattern>(PATTERNS_CATALOG[0]);
  const [pickedRotation, setPickedRotation] = useState<number>(0);

  // Sync pickedTile when tileList loads from database
  useEffect(() => {
    if (tileList.length > 0 && !currentSelection) {
      setPickedTile(tileList[0]);
      if (tileList[0].availableSizes?.[0]) {
        setSelectedSizeId(tileList[0].availableSizes[0].id);
      }
    }
  }, [tileList]);

  // Sync with currentSelection when surface or selection changes
  useEffect(() => {
    if (currentSelection) {
      if (currentSelection.productType === "tile") {
        const tileProd = currentSelection.product as TileProduct;
        setPickedTile(tileProd);
        setSelectedSizeId(tileProd.id);
      }
      if (currentSelection.productType === "paint") setPickedPaint(currentSelection.product as PaintProduct);
      if (currentSelection.productType === "counter") setPickedCounter(currentSelection.product as CounterProduct);
      if (currentSelection.productType === "cabinet") setPickedCabinet(currentSelection.product as CabinetProduct);
      if (currentSelection.grout) setPickedGrout(currentSelection.grout);
      if (currentSelection.pattern) setPickedPattern(currentSelection.pattern);
      if (currentSelection.rotation !== undefined) setPickedRotation(currentSelection.rotation);
    }
  }, [currentSelection, surface.sortOrder]);

  // Handle tile size / variant switch
  const handleSelectSize = (sizeOpt: TileSizeOption) => {
    setSelectedSizeId(sizeOpt.id);
    setPickedTile((prev) => ({
      ...prev,
      id: sizeOpt.id,
      size: sizeOpt.size,
      sku: sizeOpt.sku,
      ratio: sizeOpt.ratio,
      specifier: sizeOpt.specifier,
      swatchUrl: sizeOpt.swatchUrl || prev.swatchUrl,
      pricePerBox: sizeOpt.pricePerBox ?? prev.pricePerBox,
      pricePerSqm: sizeOpt.pricePerSqm ?? prev.pricePerSqm,
    }));
  };

  // Filter chips
  const colorCategories = ["All", "Beige", "Grey", "White", "Black", "Brown", "Green", "Special"];
  const tileCategories = ["All", "Floor", "Wall", "Outdoor", "Special"];

  const filteredTiles = tileList.filter((tile) => {
    const cleanQuery = searchQuery.trim().toLowerCase().replace(/^\^/, "");
    const matchesSearch =
      !cleanQuery ||
      tile.name.toLowerCase().includes(cleanQuery) ||
      tile.color.toLowerCase().includes(cleanQuery) ||
      tile.sku.toLowerCase().replace(/^\^/, "").includes(cleanQuery) ||
      tile.availableSizes.some((s) => s.sku.toLowerCase().replace(/^\^/, "").includes(cleanQuery));

    const matchesColor =
      selectedColorCategory === "All" ||
      tile.colorCategory.toLowerCase().includes(selectedColorCategory.toLowerCase()) ||
      tile.color.toLowerCase().includes(selectedColorCategory.toLowerCase());

    const matchesCategory =
      selectedTileCategory === "All" ||
      (tile.category && tile.category.toLowerCase() === selectedTileCategory.toLowerCase());

    return matchesSearch && matchesColor && matchesCategory;
  });

  const filteredPaints = PAINTS_CATALOG.filter((paint) => {
    const cleanQuery = searchQuery.trim().toLowerCase().replace(/^\^/, "");
    return (
      !cleanQuery ||
      paint.name.toLowerCase().includes(cleanQuery) ||
      paint.family.toLowerCase().includes(cleanQuery) ||
      paint.sku.toLowerCase().includes(cleanQuery)
    );
  });

  const handleApply = () => {
    let productToApply: AnyProduct;
    let type: "tile" | "paint" | "counter" | "cabinet";

    if (isPaintSurface) {
      productToApply = pickedPaint;
      type = "paint";
    } else if (isCounterSurface) {
      productToApply = pickedCounter;
      type = "counter";
    } else if (isCabinetSurface) {
      productToApply = pickedCabinet;
      type = "cabinet";
    } else {
      productToApply = pickedTile;
      type = "tile";
    }

    onApply({
      sortOrder: surface.sortOrder,
      product: productToApply,
      productType: type,
      grout: isTileSurface ? pickedGrout : undefined,
      pattern: isTileSurface ? pickedPattern : undefined,
      rotation: isTileSurface ? pickedRotation : undefined,
      layerUrl: surface.sampleLayer,
    });
  };

  const handleAddToCart = () => {
    if (!pickedTile) return;
    addToCart({
      id: String(selectedSizeId || pickedTile.id),
      name: `${pickedTile.name} (${pickedTile.size})`,
      price: pickedTile.pricePerBox || 32000,
      color: pickedTile.color,
      size: pickedTile.size,
      image: pickedTile.swatchUrl,
      qty: 1,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const cycleRotation = () => {
    setPickedRotation((prev) => (prev + 45) % 180);
  };

  return (
    <div className="w-full h-full flex flex-col bg-dark border-l border-stone-800 text-ivory/70 select-none">
      {/* Header Info */}
      <div className="p-4 border-b border-stone-800 bg-dark/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Selected Surface
            </span>
            {activeSide && (
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-primary/20 text-primary border border-primary/30 uppercase animate-pulse">
                Editing: {activeSide === "left" ? "Design A (Left)" : "Design B (Right)"}
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mt-0.5">
            {surface.name}
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded bg-surface">
              {surface.type}
            </span>
          </h2>
        </div>
        {currentSelection && (
          <button
            onClick={() => onRemove(surface.sortOrder)}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
            title="Remove customization from this surface"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Sub-Navigation Tabs (Only for tile surfaces) */}
      {isTileSurface && (
        <div className="grid grid-cols-3 border-b border-stone-800 bg-dark/40 text-xs font-medium text-center">
          <button
            onClick={() => setActiveTab("tile")}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === "tile"
              ? "border-primary text-primary font-semibold bg-surface/40"
              : "border-transparent text-muted-foreground hover:text-ivory/70"
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tiles ({filteredTiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("grout")}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === "grout"
              ? "border-primary text-primary font-semibold bg-surface/40"
              : "border-transparent text-muted-foreground hover:text-ivory/70"
              }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Grout</span>
          </button>
          <button
            onClick={() => setActiveTab("pattern")}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === "pattern"
              ? "border-primary text-primary font-semibold bg-surface/40"
              : "border-transparent text-muted-foreground hover:text-ivory/70"
              }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Pattern</span>
          </button>
        </div>
      )}

      {/* Search Input for SKU or Series Name */}
      {(isTileSurface || isPaintSurface) && (
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isPaintSurface ? "Search paints by name or SKU..." : "Search Mountain Ceramic tiles by name, SKU..."}
              className="w-full bg-dark border border-stone-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-ivory/70 placeholder-muted-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>
      )}

      {/* Main Tab / Swatch Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. TILE SURFACE CATALOG */}
        {isTileSurface && activeTab === "tile" && (
          <div className="space-y-3">
            {/* Active Tile Size & Pricing Selection Panel */}
            {pickedTile && pickedTile.availableSizes && pickedTile.availableSizes.length > 0 && (
              <div className="p-3 rounded-lg bg-surface/60 border border-primary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-primary" />
                    <span>Sizes for {pickedTile.name}:</span>
                  </span>
                  <span className="text-[10px] text-primary font-mono">
                    SKU: {pickedTile.sku}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pickedTile.availableSizes.map((sizeOpt) => {
                    const isSizeActive = selectedSizeId === sizeOpt.id;
                    return (
                      <button
                        key={sizeOpt.id}
                        onClick={() => handleSelectSize(sizeOpt)}
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${isSizeActive
                          ? "bg-primary border-primary text-white font-semibold shadow-sm"
                          : "bg-dark border-stone-700 text-ivory/70 hover:bg-surface"
                          }`}
                      >
                        {sizeOpt.size}
                      </button>
                    );
                  })}
                </div>
                {pickedTile.pricePerBox && (
                  <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 text-[11px]">
                    <span className="text-muted-foreground">Price per box:</span>
                    <span className="text-primary font-bold">{pickedTile.pricePerBox.toLocaleString()} RWF</span>
                    {pickedTile.pricePerSqm && (
                      <span className="text-stone-400 text-[10px]">({pickedTile.pricePerSqm.toLocaleString()} RWF/m²)</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {tileCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedTileCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${selectedTileCategory === cat
                    ? "bg-primary text-white font-semibold"
                    : "bg-surface/70 text-muted-foreground hover:text-ivory/70"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Color Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {colorCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedColorCategory(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap border transition-colors ${selectedColorCategory === cat
                    ? "border-primary bg-primary/20 text-primary font-semibold"
                    : "border-stone-800 bg-dark/60 text-stone-400 hover:text-ivory"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tile Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {filteredTiles.map((tile, idx) => {
                const isSelected = pickedTile.name === tile.name;
                return (
                  <div
                    key={tile.id}
                    onClick={() => {
                      setPickedTile(tile);
                      if (tile.availableSizes?.[0]) {
                        setSelectedSizeId(tile.availableSizes[0].id);
                      }
                    }}
                    className={`relative p-2 rounded-lg border text-left cursor-pointer transition-all duration-150 group ${isSelected
                      ? "bg-surface/90 border-primary shadow-md ring-1 ring-primary/50"
                      : "bg-dark/60 border-stone-800/80 hover:border-stone-700 hover:bg-surface/40"
                      }`}
                  >
                    <div className="w-full h-24 rounded bg-surface overflow-hidden mb-2 relative">
                      <Image
                        src={tile.swatchUrl}
                        alt={tile.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        loading={idx < 4 ? "eager" : "lazy"}
                        priority={idx < 2}
                        unoptimized
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-foreground line-clamp-1">{tile.name}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{tile.material || tile.color}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{tile.size}</span>
                      {tile.pricePerBox ? (
                        <span className="text-primary font-bold">{tile.pricePerBox.toLocaleString()} RWF</span>
                      ) : (
                        <span>{tile.availableSizes.length > 1 ? `${tile.availableSizes.length} sizes` : ""}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. TILE GROUT */}
        {isTileSurface && activeTab === "grout" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Select grout color:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {GROUT_CATALOG.map((grout) => {
                const isSelected = pickedGrout.id === grout.id;
                return (
                  <button
                    key={grout.id}
                    onClick={() => setPickedGrout(grout)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${isSelected
                      ? "bg-surface border-primary text-foreground font-semibold"
                      : "bg-dark/60 border-stone-800 text-ivory/70 hover:bg-surface/40"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-muted border border-stone-600 shadow-sm" />
                      <div>
                        <div className="text-xs">{grout.color}</div>
                        <div className="text-[10px] text-muted-foreground">{grout.brand} • SKU {grout.sku}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. TILE PATTERN */}
        {isTileSurface && activeTab === "pattern" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Select tile layout pattern:</p>
            <div className="grid grid-cols-1 gap-2">
              {PATTERNS_CATALOG.map((pat) => {
                const isSelected = pickedPattern.id === pat.id;
                return (
                  <button
                    key={pat.id}
                    onClick={() => setPickedPattern(pat)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${isSelected
                      ? "bg-surface border-primary text-foreground font-semibold"
                      : "bg-dark/60 border-stone-800 text-ivory/70 hover:bg-surface/40"
                      }`}
                  >
                    <div>
                      <div className="text-xs">{pat.name}</div>
                      <div className="text-[10px] text-muted-foreground">Ratio {pat.ratio}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-dark border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-ivory/70">Rotation Angle</span>
                <p className="text-[10px] text-muted-foreground">{pickedRotation}° orientation</p>
              </div>
              <button
                onClick={cycleRotation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-surface hover:bg-surface/80 text-primary border border-stone-700 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate +45°</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. PAINT PALETTE */}
        {isPaintSurface && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Wall paint colors ({filteredPaints.length}):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {filteredPaints.map((paint, idx) => {
                const isSelected = pickedPaint.id === paint.id;
                return (
                  <div
                    key={paint.id}
                    onClick={() => setPickedPaint(paint)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${isSelected
                      ? "bg-surface border-primary shadow-md ring-1 ring-primary/50"
                      : "bg-dark/60 border-stone-800 hover:border-stone-700"
                      }`}
                  >
                    <div className="w-full h-16 rounded overflow-hidden mb-1.5 relative border border-stone-700">
                      <Image
                        src={paint.swatchUrl}
                        alt={paint.name}
                        fill
                        sizes="100px"
                        className="object-cover"
                        loading={idx < 4 ? "eager" : "lazy"}
                        unoptimized
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-foreground line-clamp-1">{paint.name}</div>
                    <div className="text-[10px] text-muted-foreground">{paint.sku || paint.family}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. COUNTERTOP PALETTE */}
        {isCounterSurface && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Quartz & Natural Stone Slabs ({COUNTERS_CATALOG.length}):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COUNTERS_CATALOG.map((counter, idx) => {
                const isSelected = pickedCounter.id === counter.id;
                return (
                  <div
                    key={counter.id}
                    onClick={() => setPickedCounter(counter)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${isSelected
                      ? "bg-surface border-primary shadow-md ring-1 ring-primary/50"
                      : "bg-dark/60 border-stone-800 hover:border-stone-700"
                      }`}
                  >
                    <div className="w-full h-20 rounded overflow-hidden mb-1.5 relative border border-stone-700">
                      <Image
                        src={counter.swatchUrl}
                        alt={counter.name}
                        fill
                        sizes="120px"
                        className="object-cover"
                        loading={idx < 4 ? "eager" : "lazy"}
                        unoptimized
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-foreground line-clamp-1">{counter.name}</div>
                    <div className="text-[10px] text-muted-foreground">{counter.finish}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. CABINET FINISHES */}
        {isCabinetSurface && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cabinet finishes ({CABINETS_CATALOG.length}):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CABINETS_CATALOG.map((cab, idx) => {
                const isSelected = pickedCabinet.id === cab.id;
                return (
                  <div
                    key={cab.id}
                    onClick={() => setPickedCabinet(cab)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${isSelected
                      ? "bg-surface border-primary shadow-md ring-1 ring-primary/50"
                      : "bg-dark/60 border-stone-800 hover:border-stone-700"
                      }`}
                  >
                    <div className="w-full h-16 rounded overflow-hidden mb-1.5 relative border border-stone-700">
                      <Image
                        src={cab.swatchUrl}
                        alt={cab.name}
                        fill
                        sizes="100px"
                        className="object-cover"
                        loading={idx < 4 ? "eager" : "lazy"}
                        unoptimized
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-foreground line-clamp-1">{cab.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Apply Bar */}
      <div className="p-4 border-t border-stone-800 bg-dark/70 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="truncate max-w-[200px] font-medium text-foreground">
            {isPaintSurface
              ? pickedPaint.name
              : isCounterSurface
                ? pickedCounter.name
                : isCabinetSurface
                  ? pickedCabinet.name
                  : `${pickedTile.name} (${pickedTile.size})`}
          </span>
          <span className="text-primary font-mono text-[11px]">
            {isTileSurface && pickedTile.pricePerBox
              ? `${pickedTile.pricePerBox.toLocaleString()} RWF/box`
              : isTileSurface
                ? pickedTile.sku
                : ""}
          </span>
        </div>

        <div className="flex gap-2">
          {isTileSurface && (
            <button
              onClick={handleAddToCart}
              className="py-2.5 px-3 rounded-lg bg-surface hover:bg-surface/80 text-primary border border-primary/40 font-semibold text-xs tracking-wide uppercase transition-colors shadow flex items-center justify-center gap-1.5"
              title="Add 1 box of this tile to cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{addedToast ? "Added!" : "Add to Cart"}</span>
            </button>
          )}

          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/80 text-white font-semibold text-xs tracking-wide uppercase transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>
              Apply {isPaintSurface ? "Color" : isCounterSurface ? "Slab" : "Tile"} to {surface.name}
              {activeSide && ` (${activeSide === "left" ? "Side A" : "Side B"})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
