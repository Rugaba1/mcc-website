"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  PAINTS_CATALOG,
  COUNTERS_CATALOG,
  CABINETS_CATALOG,
  GROUT_CATALOG,
  PATTERNS_CATALOG,
  TileSizeOption,
  PaintProduct,
  CounterProduct,
  CabinetProduct,
  GroutColor,
  TilePattern,
} from "../data/catalog";
import { SurfaceDefinition } from "../data/scenes";
import { SurfaceSelection, AnyProduct } from "../types/visualizer";
import { Search, Layers, Grid, Palette, RotateCw, Trash2, Check, Ruler, PackagePlus } from "lucide-react";
import { useCart } from "../contexts/cart-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PurchaseOptions } from "./purchase-option";
import { Product } from "@/lib/api";
import { dbProductToTileProduct } from "@/lib/visualizer-adapter";
import { useFormatters } from "@/contexts/format-context";
interface ProductPickerProps {
  surface: SurfaceDefinition;
  currentSelection: SurfaceSelection | null;
  onApply: (selection: SurfaceSelection) => void;
  onRemove: (sortOrder: number) => void;
  activeSide?: "left" | "right";
  dbTiles?: Product[];
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
  const { displayMoney } = useFormatters();
  const { addToCart } = useCart();
  const [addedToast, setAddedToast] = useState(false);

  const isPaintSurface = surface.category === "Paint" || surface.type === "TRIM" || surface.type === "PAINTED WALL";
  const isCounterSurface = surface.category === "Counter" || surface.type === "COUNTER";
  const isCabinetSurface = surface.category === "Cabinet" || surface.type === "CABINETS";
  const isTileSurface = !isPaintSurface && !isCounterSurface && !isCabinetSurface;
  const [buyOpen, setBuyOpen] = useState(false);
  const tileList = dbTiles ?? [];
  const visualizerTiles = tileList.map(dbProductToTileProduct);
  const [activeTab, setActiveTab] = useState<"tile" | "grout" | "pattern">("tile");
  const [searchQuery, setSearchQuery] = useState(initialFilter || "");
  const [selectedColorCategory, setSelectedColorCategory] = useState<string>("All");
  const [selectedTileCategory, setSelectedTileCategory] = useState<string>("All");
  const handleAddToCart = () => { if (buy) setBuyOpen(true); };
  useEffect(() => {
    if (initialFilter) {
      setSearchQuery(initialFilter);
    }
  }, [initialFilter]);

  // Selected state
  const [pickedTile, setPickedTile] = useState<Product | null>(tileList[0] ?? null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | undefined>(
    tileList[0]?.variants?.[0]?.id ?? tileList[0]?.id
  );
  const [pickedPaint, setPickedPaint] = useState<PaintProduct>(PAINTS_CATALOG[0]);
  const [pickedCounter, setPickedCounter] = useState<CounterProduct>(COUNTERS_CATALOG[0]);
  const [pickedCabinet, setPickedCabinet] = useState<CabinetProduct>(CABINETS_CATALOG[0]);

  const [pickedGrout, setPickedGrout] = useState<GroutColor>(GROUT_CATALOG[0]);
  const [pickedPattern, setPickedPattern] = useState<TilePattern>(PATTERNS_CATALOG[0]);
  const [pickedRotation, setPickedRotation] = useState<number>(0);
  const pickedTileView = pickedTile ? dbProductToTileProduct(pickedTile) : null;
  const size = pickedTileView?.availableSizes.find((s) => s.id === selectedSizeId) ?? pickedTileView?.availableSizes[0];
  const buy = pickedTile && size?.variantId && (size.pricePerSqm ?? 0) > 0
    ? { variantId: size.variantId, pricePerSqm: size.pricePerSqm!, containerPricePerSqm: size.containerPricePerSqm ?? null, sqmPerContainer: size.sqmPerContainer ?? null }
    : null;
  // Sync pickedTile when tileList loads from database
  useEffect(() => {
    if (tileList.length > 0 && !currentSelection) {
      setPickedTile(tileList[0]);
      const firstSize = dbProductToTileProduct(tileList[0]).availableSizes[0];
      if (firstSize) {
        setSelectedSizeId(firstSize.id);
      }
    }
  }, [dbTiles, currentSelection]);

  // Sync with currentSelection when surface or selection changes
  useEffect(() => {
    if (currentSelection) {
      if (currentSelection.productType === "tile") {
        const selectedTile = currentSelection.product;
        const matchingProduct = tileList.find((product) =>
          product.id === selectedTile.id || product.variants?.some((variant) => variant.id === selectedTile.id)
        );
        if (matchingProduct) {
          setPickedTile(matchingProduct);
          setSelectedSizeId(selectedTile.id);
        }
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
  };

  // Filter chips
  const colorCategories = ["All", "Beige", "Grey", "White", "Black", "Brown", "Green", "Special"];
  const tileCategories = ["All", "Floor", "Wall", "Outdoor", "Special"];

  const filteredTiles = visualizerTiles.filter((tile) => {
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
      if (!pickedTile) return;
      const tileProduct = dbProductToTileProduct(pickedTile);
      const selectedSize = tileProduct.availableSizes.find((sizeOption) => sizeOption.id === selectedSizeId)
        ?? tileProduct.availableSizes[0];
      productToApply = selectedSize
        ? {
          ...tileProduct,
          id: selectedSize.id,
          size: selectedSize.size,
          sku: selectedSize.sku,
          ratio: selectedSize.ratio,
          specifier: selectedSize.specifier,
          swatchUrl: selectedSize.swatchUrl || tileProduct.swatchUrl,
          pricePerBox: selectedSize.pricePerBox ?? tileProduct.pricePerBox,
          pricePerSqm: selectedSize.pricePerSqm ?? tileProduct.pricePerSqm,
        }
        : tileProduct;
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


  const cycleRotation = () => {
    setPickedRotation((prev) => (prev + 45) % 180);
  };

  return (
    <div className="w-full sm:h-full h-[70vh] flex flex-col bg-card text-card-foreground border-l border-border px-3 select-none">
      {/* Header Info */}
      <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Selected Surface
            </span>
            {activeSide && (
              <Badge variant="outline" className="h-auto border-primary/30 bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                Editing: {activeSide === "left" ? "Design A (Left)" : "Design B (Right)"}
              </Badge>
            )}
          </div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mt-0.5">
            {surface.name}
            <Badge variant="outline" className="h-auto bg-background px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {surface.type}
            </Badge>
          </h2>
        </div>
        {isTileSurface && (

          <Button
            onClick={handleAddToCart}
            variant={"secondary"}
            title="Add 1 box of this tile to your order"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{addedToast ? "Added!" : "Add to order"}</span>
          </Button>
        )}
        {currentSelection && (
          <Button
            onClick={() => onRemove(surface.sortOrder)}
            variant={"destructive"}
            title="Remove customization from this surface"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      {/* Sub-Navigation Tabs (Only for tile surfaces) */}
      {isTileSurface && (
        <div className="grid grid-cols-3     text-sm font-medium text-center">
          <Button
            onClick={() => setActiveTab("tile")}
            variant={activeTab === "tile" ? "default" : "outline"}
            className={`py-2.5 flex items-center justify-center gap-1.5  transition-colors `}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tiles ({filteredTiles.length})</span>
          </Button>
          <Button
            onClick={() => setActiveTab("grout")}
            variant={activeTab === "grout" ? "default" : "outline"}
            className={`py-2.5 flex items-center justify-center gap-1.5  transition-colors`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Grout</span>
          </Button>
          <Button
            onClick={() => setActiveTab("pattern")}
            variant={activeTab === "pattern" ? "default" : "outline"}
            className={`py-2.5 flex items-center justify-center gap-1.5  transition-colors `}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Pattern</span>
          </Button>
        </div>
      )}

      {/* Search Input for SKU or Series Name */}
      {(isTileSurface || isPaintSurface) && (
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isPaintSurface ? "Search paints by name or SKU..." : "Search Mountain Ceramic tiles by name, SKU..."}
              className="w-full    pl-9 pr-3 py-1.5 text-xs  placeholder-muted-foreground "
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
            {pickedTileView && pickedTileView.availableSizes.length > 0 && (
              <div className="p-3   bg-background/60 border border-primary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold  flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-primary" />
                    <span>Sizes for {pickedTileView.name}:</span>
                  </span>
                  <span className="text-[10px] text-primary font-mono">
                    SKU: {pickedTileView.sku}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pickedTileView.availableSizes.map((sizeOpt) => {
                    const isSizeActive = selectedSizeId === sizeOpt.id;
                    return (
                      <Button
                        key={sizeOpt.id}
                        variant={isSizeActive ? "default" : "outline"}
                        onClick={() => handleSelectSize(sizeOpt)}

                      >
                        {sizeOpt.size}
                      </Button>
                    );
                  })}
                </div>
                {pickedTileView.pricePerBox && (
                  <div className="flex items-center justify-between pt-1 border-t border-border/80 text-[11px]">
                    <span className="text-muted-foreground">Price per box:</span>
                    <span className="text-primary font-bold">{displayMoney(pickedTileView.pricePerBox)}</span>
                    {pickedTileView.pricePerSqm && (
                      <span className="text-sm">({displayMoney(pickedTileView.pricePerSqm)}/m²)</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {tileCategories.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setSelectedTileCategory(cat)}
                  className={`text-[11px] px-2.5 py-1  whitespace-nowrap transition-colors ${selectedTileCategory === cat
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-background/70 text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Color Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {colorCategories.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setSelectedColorCategory(cat)}
                  variant={selectedColorCategory === cat ? "default" : "outline"}
                  className={`text-[10px] px-2 py-0.5  whitespace-nowrap border transition-colors `}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Tile Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {filteredTiles.map((tile, idx) => {
                const isSelected = pickedTile?.id === tile.id;
                return (
                  <div
                    key={tile.id}
                    onClick={() => {
                      const product = tileList.find((item) => item.id === tile.id);
                      if (!product) return;
                      setPickedTile(product);
                      if (tile.availableSizes[0]) {
                        setSelectedSizeId(tile.availableSizes[0].id);
                      }
                    }}
                    className={`relative p-2  border text-left cursor-pointer transition-all duration-150 group ${isSelected
                      ? "bg-background/90 border-primary shadow-md ring-1 ring-primary/50"
                      : "bg-muted text-foreground hover:border-primary/50 hover:bg-accent"
                      }`}
                  >
                    <div className="w-full h-24  bg-background overflow-hidden mb-2 relative">
                      <Image
                        src={tile.swatchUrl}
                        alt={tile.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        loading={idx < 4 ? "eager" : "lazy"}
                        priority={idx < 2}

                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5  bg-primary text-primary-foreground flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-foreground line-clamp-1">{tile.name}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{tile.material || tile.color}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{tile.size}</span>
                      {tile.pricePerBox ? (
                        <span className="text-primary font-bold">{displayMoney(tile.pricePerBox)}</span>
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
                  <Button
                    key={grout.id}
                    variant={"ghost"}
                    onClick={() => setPickedGrout(grout)}
                    className={`flex items-center justify-between p-2.5  border text-left transition-all `}
                  >
                    <div className="flex items-center gap-2.5">
                      <Checkbox checked={isSelected} className="w-5 h-5 bg-muted border shadow-sm" />
                      <div>
                        <div className="text-xs">{grout.color}</div>
                        <div className="text-[10px] text-muted-foreground">{grout.brand} • SKU {grout.sku}</div>
                      </div>
                    </div>
                  </Button>
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
                  <Button
                    key={pat.id}
                    variant={"ghost"}
                    onClick={() => setPickedPattern(pat)}
                    className={`flex items-center justify-between p-3  border text-left transition-all `}
                  >
                    <div className="flex items-center gap-2.5"><Checkbox checked={isSelected} className="w-5 h-5 bg-muted border shadow-sm" />
                      <div>
                        <div className="text-xs">{pat.name}</div>
                        <div className="text-[10px] text-muted-foreground">Ratio {pat.ratio}</div>
                      </div>
                    </div>

                  </Button>
                );
              })}
            </div>

            <div className="p-3  bg-inverse border   flex items-center justify-between">
              <div>
                <span className="text-xs font-medium  ">Rotation Angle</span>
                <p className="text-[10px] text-muted-foreground">{pickedRotation}° orientation</p>
              </div>
              <Button
                onClick={cycleRotation}
                className="flex items-center gap-1.5 px-3 py-1.5  text-xs font-semibold bg-background hover:bg-background/80 text-primary border   transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate +45°</span>
              </Button>
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
                    className={`p-2  border text-left cursor-pointer transition-all ${isSelected
                      ? "bg-background border-primary shadow-md ring-1 ring-primary/50"
                      : "bg-muted text-foreground hover:bg-accent"
                      }`}
                  >
                    <div className="w-full h-16  overflow-hidden mb-1.5 relative border ">
                      <Image
                        src={paint.swatchUrl}
                        alt={paint.name}
                        fill
                        sizes="100px"
                        className="object-cover"
                        loading={idx < 4 ? "eager" : "lazy"}

                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4  bg-primary text-primary-foreground flex items-center justify-center">
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
                    className={`p-2 border text-left cursor-pointer transition-all ${isSelected
                      ? "bg-background border-primary shadow-md ring-1 ring-primary/50"
                      : "bg-muted text-foreground hover:bg-accent"
                      }`}
                  >
                    <div className="w-full h-20  overflow-hidden mb-1.5 relative border  ">
                      <Image
                        src={counter.swatchUrl}
                        alt={counter.name}
                        fill
                        sizes="120px"
                        className="object-cover"
                        loading={idx < 4 ? "eager" : "lazy"}

                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground flex items-center justify-center">
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
                    className={`p-2  border text-left cursor-pointer transition-all ${isSelected
                      ? "bg-background border-primary shadow-md ring-1 ring-primary/50"
                      : "bg-muted text-foreground hover:bg-accent"
                      }`}
                  >
                    <div className="w-full h-16  overflow-hidden mb-1.5 relative border ">
                      <Image
                        src={cab.swatchUrl}
                        alt={cab.name}
                        fill
                        sizes="100px"
                        className="object-cover"
                        loading={idx < 4 ? "eager" : "lazy"}

                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4  bg-primary text-primary-foreground flex items-center justify-center">
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
      <div className="p-4   space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="truncate max-w-50 font-medium text-foreground">
            {isPaintSurface
              ? pickedPaint?.name
              : isCounterSurface
                ? pickedCounter?.name
                : isCabinetSurface
                  ? pickedCabinet?.name
                  : `${pickedTileView?.name ?? ""} (${pickedTileView?.availableSizes.find((option) => option.id === selectedSizeId)?.size ?? pickedTileView?.size ?? ""})`}
          </span>
          <span className="text-primary font-mono text-[11px]">
            {isTileSurface && pickedTileView?.pricePerBox
              ? `${displayMoney(pickedTileView?.pricePerSqm ?? 0)}/m2`
              : isTileSurface
                ? pickedTileView?.sku
                : ""}
          </span>
        </div>

        <div className="flex gap-2">


          <Button
            onClick={handleApply}
            className="flex-1 py-2.5  bg-primary hover:bg-primary/80 text-primary-foreground font-semibold text-xs tracking-wide uppercase transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>
              Apply {isPaintSurface ? "Color" : isCounterSurface ? "Slab" : "Tile"} to {surface.name}
              {activeSide && ` (${activeSide === "left" ? "Side A" : "Side B"})`}
            </span>
          </Button>
        </div>
      </div>
      {buy && pickedTile && size && (
        <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{pickedTileView?.name} ({size.size})</DialogTitle>
              <DialogDescription>Choose how you want to buy.</DialogDescription>
            </DialogHeader>
            <PurchaseOptions
              variant={{ pricePerSqm: buy.pricePerSqm, containerPricePerSqm: buy.containerPricePerSqm, sqmPerContainer: buy.sqmPerContainer }}
              onAdd={({ saleType, qty }) => {
                addToCart({
                  variantId: buy.variantId, productId: pickedTile.id, name: pickedTile.name,
                  image: size.swatchUrl ?? pickedTile.image, size: size.size, finish: null, color: pickedTile.colors[0] ?? "",
                  saleType, pricePerSqm: buy.pricePerSqm,
                  containerPricePerSqm: buy.containerPricePerSqm, sqmPerContainer: buy.sqmPerContainer,
                }, qty);
                setBuyOpen(false);
                setAddedToast(true);
                setTimeout(() => setAddedToast(false), 2500);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
