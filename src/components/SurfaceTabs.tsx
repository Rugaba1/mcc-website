"use client";

import React from "react";
import { SurfaceDefinition } from "@/data/scenes";
import { SelectionMap } from "@/types/visualizer";
import { CheckCircle2 } from "lucide-react";

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
    <div className="w-full bg-dark -b -stone-800 py-2 px-3 overflow-x-auto no-scrollbar flex items-center gap-1.5 select-none">
      <span className="text-[11px] font-semibold  uppercase tracking-wider pl-1 pr-2 whitespace-nowrap">
        Surfaces:
      </span>
      {surfaces.map((surf) => {
        const isSelected = surf.sortOrder === activeSurfaceSortOrder;
        const isApplied = !!selections[surf.sortOrder];

        return (
          <button
            key={surf.sortOrder}
            onClick={() => onSelectSurface(surf.sortOrder)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150  ${isSelected
              ? "bg-primary  -primary font-semibold shadow-sm"
              : isApplied
                ? "bg-surface text-ivory/70 -stone-700 hover:-primary/50"
                : "bg-dark/60  -stone-800 hover:text-ivory/70 hover:bg-surface/60"
              }`}
          >
            <span>{surf.name}</span>
            {isApplied && (
              <CheckCircle2
                className={`w-3.5 h-3.5 ${isSelected ? "" : "text-primary"
                  }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
