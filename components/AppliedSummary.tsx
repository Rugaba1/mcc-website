"use client";

import React, { useState } from "react";
import { SceneDefinition } from "@/data/scenes";
import { SelectionMap } from "@/types/visualizer";
import { TileProduct } from "@/data/catalog";
import { Code, Trash2, CheckCircle, ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "./ui/button";

interface AppliedSummaryProps {
  scene: SceneDefinition;
  selections: SelectionMap;
  onSelectSurface: (sortOrder: number) => void;
  onRemove: (sortOrder: number) => void;
  onClearAll: () => void;
}

export const AppliedSummary: React.FC<AppliedSummaryProps> = ({
  scene,
  selections,
  onSelectSurface,
  onRemove,
  onClearAll,
}) => {
  const { addToCart } = useCart();
  const [showDsl, setShowDsl] = useState<boolean>(false);
  const [addedAllToast, setAddedAllToast] = useState<boolean>(false);

  // Compute selection vector for all surfaces of this scene
  const selArray = scene.surfaces.map((s) => {
    const sel = selections[s.sortOrder];
    if (!sel) return "-1";
    return `${sel.product.id}(${sel.grout ? sel.grout.id : "-1"},${sel.rotation === 0 ? "-1" : "25425" + (2 + ((sel.rotation || 0) / 45))})`;
  });
  const selString = selArray.join(",");

  // Compute Chameleon Power APPLY AST query
  const applyArray = scene.surfaces.map((s) => {
    const sel = selections[s.sortOrder];
    if (!sel) return "~";
    return `${sel.product.specifier}${sel.grout ? `(APPLY=(${sel.grout.specifier},~))` : ""}`;
  });
  const compiledQuery = `${scene.specifier}(APPLY=(${applyArray.join(",")}),OPTIMIZE=1)`;

  const appliedCount = Object.values(selections).filter(Boolean).length;

  const handleAddAllToCart = () => {
    scene.surfaces.forEach((surf) => {
      const sel = selections[surf.sortOrder];
      if (sel && sel.productType === "tile") {
        const tile = sel.product as TileProduct;
        addToCart({
          id: String(tile.id),
          name: `${tile.name} (${tile.size})`,
          price: tile.pricePerBox || 32000,
          color: tile.color,
          size: tile.size,
          image: tile.swatchUrl,
          qty: 1,
        });
      }
    });
    setAddedAllToast(true);
    setTimeout(() => setAddedAllToast(false), 2500);
  };

  return (
    <div className="bg-dark border-t border p-3 select-none">
      <div className="flex items-center flex-wrap justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            Applied Finishes ({appliedCount} / {scene.surfaces.length})
          </span>
          <Button
            onClick={() => setShowDsl(!showDsl)}
            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 px-2 py-0.5  bg-background border  transition-colors"
          >
            <Code className="w-3 h-3" />
            <span>DSL Code</span>
            {showDsl ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
        {/* Applied Surfaces Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {scene.surfaces.map((surf) => {
            const sel = selections[surf.sortOrder];
            if (!sel) return null;

            const pricePerBox = (sel.product as TileProduct).pricePerBox;

            return (
              <div
                key={surf.sortOrder}
                className="flex items-center flex-wrap gap-2 px-2.5 py-1.5  bg-background/70 border text-xs shrink-0"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => onSelectSurface(surf.sortOrder)}
                >
                  <div className="font-medium   flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span>{surf.name}</span>
                  </div>
                  <div className="text-[10px] text-primary font-normal">
                    {sel.product.name}
                    {pricePerBox ? ` • ${pricePerBox.toLocaleString()} RWF` : ""}
                  </div>
                </div>
                <Button
                  onClick={() => onRemove(surf.sortOrder)}
                  variant={"destructive"}
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
          {appliedCount === 0 && (
            <p className="text-xs text-muted-foreground py-1">
              No customized surfaces in {scene.name}. Click any surface in the scene to pick real Mountain Ceramic tiles!
            </p>
          )}
        </div>

      </div>



      {showDsl && (
        <div className="mt-2.5 p-2.5  bg-dark border  text-[11px] font-mono space-y-1.5">
          <div>
            <span className="text-muted-foreground block text-[10px]">URL Selection Vector (sel):</span>
            <div className="text-primary break-all select-all">{selString}</div>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Compiled RenderFarm Query (APPLY AST):</span>
            <div className="text-success break-all select-all">{compiledQuery}</div>
          </div>
        </div>
      )}
    </div>
  );
};
