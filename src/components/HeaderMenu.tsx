"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Undo2,
  Redo2,
  Columns,
  ZoomIn,
  Share2,
  Save,
  Check,
  Sparkles,
  Search,
  X,
  ExternalLink,
  Layers,
} from "lucide-react";
import { TILES_CATALOG, TileProduct } from "@/data/catalog";
import { ALL_ROOM_SCENES } from "@/data/scenes";

interface HeaderMenuProps {
  sceneName: string;
  isCompareMode: boolean;
  onToggleCompare: () => void;
  isZoomMode: boolean;
  onToggleZoom: () => void;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  onReset?: () => void;
  shareUrl: string;
  onQuickApplyProduct?: (product: TileProduct, surfaceSortOrder: number) => void;
  onOpenRooms?: () => void;
  onOpenRoomsModal?: () => void;
  dbTiles?: TileProduct[];
}

export const HeaderMenu: React.FC<HeaderMenuProps> = ({
  sceneName,
  isCompareMode,
  onToggleCompare,
  isZoomMode,
  onToggleZoom,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  shareUrl,
  onQuickApplyProduct,
  onOpenRooms,
  onOpenRoomsModal,
  dbTiles,
}) => {
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [skuInput, setSkuInput] = useState("");
  const [targetSurfaceSortOrder, setTargetSurfaceSortOrder] = useState<number>(1);

  const tileList = dbTiles && dbTiles.length > 0 ? dbTiles : TILES_CATALOG;

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleApplySku = (tile: TileProduct) => {
    if (onQuickApplyProduct) {
      onQuickApplyProduct(tile, targetSurfaceSortOrder);
    }
    setIsSkuModalOpen(false);
  };

  const matchedTiles = skuInput.trim()
    ? tileList.filter((t) => {
        const q = skuInput.trim().toLowerCase().replace(/^\^/, "");
        return (
          t.sku.toLowerCase().replace(/^\^/, "").includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.color.toLowerCase().includes(q) ||
          t.availableSizes.some((s) => s.sku.toLowerCase().replace(/^\^/, "").includes(q))
        );
      })
    : tileList.slice(0, 8);

  const handleOpenRooms = onOpenRooms || onOpenRoomsModal;

  return (
    <header className="h-14 bg-dark border-b border-stone-800 px-4 flex items-center justify-between z-40 select-none">
      

      {/* Primary Toolbar Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Switch Room Scenes Button */}
        {handleOpenRooms && (
          <button
            onClick={handleOpenRooms}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-surface border border-stone-700 hover:border-primary text-ivory/70 hover:text-white transition-all shadow-sm"
            title="Browse all 15 room scenes"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Rooms (15)</span>
          </button>
        )}

        {/* Quick SKU / Product Page Link Simulator */}
        {onQuickApplyProduct && (
          <button
            onClick={() => setIsSkuModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-surface border border-stone-700 hover:border-primary text-ivory/70 hover:text-white transition-all shadow-sm"
            title="Apply real Mountain Ceramic tile by SKU or name"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Find Tile</span>
          </button>
        )}

        {/* Compare Mode Split-Screen Toggle */}
        <button
          onClick={onToggleCompare}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
            isCompareMode
              ? "bg-primary border-primary text-white shadow"
              : "bg-surface border-stone-700 text-ivory/70 hover:bg-surface/80"
          }`}
          title="Compare Design A vs Design B"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compare</span>
        </button>

        {/* Pan / Zoom Interactive Inspector */}
        <button
          onClick={onToggleZoom}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
            isZoomMode
              ? "bg-primary border-primary text-white shadow"
              : "bg-surface border-stone-700 text-ivory/70 hover:bg-surface/80"
          }`}
          title="Zoom & Pan inspection mode"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Zoom</span>
        </button>

        {/* Undo / Redo */}
        <div className="hidden lg:flex items-center bg-surface border border-stone-700 rounded-md p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded ${
              canUndo ? "hover:bg-dark text-ivory/70 hover:text-white" : "opacity-30 cursor-not-allowed"
            }`}
            title="Undo last customization"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded ${
              canRedo ? "hover:bg-dark text-ivory/70 hover:text-white" : "opacity-30 cursor-not-allowed"
            }`}
            title="Redo customization"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share & Save Design Actions */}
        <button
          onClick={handleCopyShare}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-surface border border-stone-700 hover:border-primary text-ivory/70 hover:text-white transition-all shadow-sm"
          title="Copy shareable link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">{copied ? "Copied" : "Share"}</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-surface border border-stone-700 hover:border-primary text-ivory/70 hover:text-white transition-all shadow-sm"
          title="Save Design"
        >
          {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">{saveSuccess ? "Saved!" : "Save"}</span>
        </button>
      </div>

      {/* Quick Search Modal */}
      {isSkuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-dark border border-stone-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Find Mountain Ceramic Tile
                </h3>
              </div>
              <button
                onClick={() => setIsSkuModalOpen(false)}
                className="p-1 rounded text-stone-400 hover:text-white hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Search Mountain Ceramic products by SKU or name to instantly project them into the room scene.
              </p>

              {/* SKU Search */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Enter SKU or Product Name:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={skuInput}
                    onChange={(e) => setSkuInput(e.target.value)}
                    placeholder="e.g. MCC-AGAPE, Calacatta, Sandstone..."
                    className="w-full bg-dark border border-stone-700 rounded-md pl-9 pr-3 py-2 text-xs text-ivory/70 placeholder-muted-foreground focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {matchedTiles.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleApplySku(t)}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface/50 border border-stone-800 hover:border-primary hover:bg-surface cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-dark shrink-0">
                        <Image src={t.swatchUrl} alt={t.name} fill className="object-cover" unoptimized />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {t.color} • {t.size} • <span className="font-mono text-primary">{t.sku}</span>
                        </div>
                      </div>
                    </div>
                    {t.pricePerBox && (
                      <span className="text-xs font-bold text-primary mr-2">
                        {t.pricePerBox.toLocaleString()} RWF
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
