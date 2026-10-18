"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Undo2,
  Redo2,
  Columns,
  ZoomIn,
  Share2,
  Save,
  Check,
  Search,
  X,
  ExternalLink,
  Layers,
} from "lucide-react";
import { TILES_CATALOG, TileProduct } from "../data/catalog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

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
    <div className="h-14  border-b border px-4 flex items-center justify-between  select-none">


      {/* Primary Toolbar Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Switch Room Scenes Button */}
        {handleOpenRooms && (
          <Button
            onClick={handleOpenRooms}
            variant={"outline"}
            title="Browse all 15 room scenes"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Rooms (15)</span>
          </Button>
        )}

        {/* Quick SKU / Product Page Link Simulator */}
        {onQuickApplyProduct && (
          <Button
            onClick={() => setIsSkuModalOpen(true)}
            variant={"outline"}
            title="Apply real Mountain Ceramic tile by SKU or name"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Find Tile</span>
          </Button>
        )}

        {/* Compare Mode Split-Screen Toggle */}
        <Button
          onClick={onToggleCompare}
          variant={isCompareMode ? "secondary" : "outline"}
          title="Compare Design A vs Design B"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compare</span>
        </Button>

        {/* Pan / Zoom Interactive Inspector */}
        <Button
          onClick={onToggleZoom}
          variant={isZoomMode ? "secondary" : "outline"}
          title="Zoom & Pan inspection mode"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Zoom</span>
        </Button>

        {/* Undo / Redo */}
        <div className="hidden lg:flex items-center bg-background border    p-0.5">
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant={canUndo ? "secondary" : "outline"}
            title="Undo last customization"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={onRedo}
            disabled={!canRedo}
            variant={canRedo ? "secondary" : "outline"}
            title="Redo customization"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Share & Save Design Actions */}
        <Button
          onClick={handleCopyShare}
          variant={"outline"}
          title="Copy shareable link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">{copied ? "Copied" : "Share"}</span>
        </Button>

        <Button
          onClick={handleSave}
          variant={"outline"}
          title="Save Design"
        >
          {saveSuccess ? <Check className="w-3.5 h-3.5 text-success" /> : <Save className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">{saveSuccess ? "Saved!" : "Save"}</span>
        </Button>
      </div>


      <Dialog open={isSkuModalOpen} onOpenChange={setIsSkuModalOpen}>
        <DialogContent className="sm:max-w-3xl  bg-background">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">
                  Find Mountain Ceramic Tile
                </h1>
              </div>
            </DialogTitle>
            <DialogDescription>
              <p className="text-md text-muted-foreground">
                Search Mountain Ceramic products by SKU or name to instantly project them into the room scene.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="w-full     overflow-hidden flex flex-col">


            <div className="p-4 space-y-4">


              {/* SKU Search */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Enter SKU or Product Name:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={skuInput}
                    onChange={(e) => setSkuInput(e.target.value)}
                    placeholder="e.g. MCC-AGAPE, Calacatta, Sandstone..."
                    className="w-full    pl-9 pr-3 py-2 text-xs   placeholder-muted-foreground focus:outline-none focus:border-primary"
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
                    className="flex items-center justify-between p-2 -lg bg-background/50 border  hover:border-primary hover:bg-background cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10  overflow-hidden bg-dark shrink-0">
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
        </DialogContent>
      </Dialog>

    </div>
  );
};
