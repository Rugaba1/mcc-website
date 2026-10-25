"use client";

import React from "react";
import { SurfaceDefinition } from "../data/scenes";
import { SelectionMap } from "../types/visualizer";
import { CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

interface SurfaceTabsProps {
  surfaces: SurfaceDefinition[];
  activeSurfaceSortOrder: number;
  onSelectSurface: (sortOrder: number) => void;
  selections: SelectionMap;
}

export const SurfaceTabs: React.FC<SurfaceTabsProps> = ({
  surfaces,
  activeSurfaceSortOrder,
  onSelectSurface,
  selections,
}) => {
  return (
    <div className="w-full bg-inverse text-inverse-foreground border-b border-inverse-border py-2 px-3 overflow-x-auto no-scrollbar flex items-center gap-1.5 select-none">
      <span className="text-[11px] font-semibold  uppercase tracking-wider pl-1 pr-2 whitespace-nowrap">
        Surfaces:
      </span>
      {surfaces.map((surf) => {
        const isSelected = surf.sortOrder === activeSurfaceSortOrder;
        const isApplied = !!selections[surf.sortOrder];

        return (
          <Button
            key={surf.sortOrder}
            onClick={() => onSelectSurface(surf.sortOrder)}
            variant={isSelected?"default":isApplied?"secondary":"outline"}
             
          >
            <span>{surf.name}</span>
            {isApplied && (
              <CheckCircle2
                className={`w-3.5 h-3.5 ${isSelected ? "" : "text-primary"
                  }`}
              />
            )}
          </Button>
        );
      })}
    </div>
  );
};
