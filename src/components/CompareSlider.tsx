"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SceneDefinition } from "@/data/scenes";
import { VisualizerCanvas } from "./VisualizerCanvas";
import { SelectionMap } from "@/types/visualizer";
import { GripVertical } from "lucide-react";

interface CompareSliderProps {
  scene: SceneDefinition;
  leftSelections: SelectionMap;
  rightSelections: SelectionMap;
  activeSide: "left" | "right";
  onSelectSide: (side: "left" | "right") => void;
  activeSurfaceSortOrder: number;
  onSelectSurface: (sortOrder: number) => void;
  className?: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  scene,
  leftSelections,
  rightSelections,
  activeSide,
  onSelectSide,
  activeSurfaceSortOrder,
  onSelectSurface,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => setIsDragging(true);

  // Track mouse position over container to automatically switch active side
  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const currentDividerX = (sliderPosition / 100) * rect.width;

    // Automatically track which side of the slider the mouse is on
    const mouseSide: "left" | "right" = x < currentDividerX ? "left" : "right";
    if (mouseSide !== activeSide) {
      onSelectSide(mouseSide);
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const currentDividerX = (sliderPosition / 100) * rect.width;
    const mouseSide: "left" | "right" = x < currentDividerX ? "left" : "right";
    onSelectSide(mouseSide);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("touchend", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
    }
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onClick={handleContainerClick}
      className={`relative w-full h-full flex items-center justify-center bg-dark overflow-hidden select-none ${className || ""}`}
    >
      {/* 1. Base Layer: Right Side (Design B) */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <VisualizerCanvas
          scene={scene}
          selections={rightSelections}
          activeSurfaceSortOrder={activeSurfaceSortOrder}
          onSelectSurface={onSelectSurface}
          isZoomMode={false}
        />
        {/* Design B Label Badge (auto-highlights on hover) */}
        <div
          className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg  text-xs font-semibold backdrop-blur-md shadow-lg transition-all ${activeSide === "right"
            ? "bg-primary  -primary ring-2 ring-primary/50 scale-105"
            : "bg-dark/80 -stone-700 text-ivory/70 opacity-70"
            }`}
        >
          <div className="flex items-center gap-1.5">
            <span>Design B (Right)</span>
            {activeSide === "right" && (
              <span className="text-[10px] bg-dark text-primary px-1 rounded font-bold">
                ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Clipped Overlay: Left Side (Design A) */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
          <VisualizerCanvas
            scene={scene}
            selections={leftSelections}
            activeSurfaceSortOrder={activeSurfaceSortOrder}
            onSelectSurface={onSelectSurface}
            isZoomMode={false}
          />
        </div>
      </div>

      {/* Design A Label Badge (auto-highlights on hover) */}
      <div
        className={`absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg  text-xs font-semibold backdrop-blur-md shadow-lg transition-all ${activeSide === "left"
          ? "bg-primary  -primary ring-2 ring-primary/50 scale-105"
          : "bg-dark/80 -stone-700 text-ivory/70 opacity-70"
          }`}
      >
        <div className="flex items-center gap-1.5">
          <span>Design A (Left)</span>
          {activeSide === "left" && (
            <span className="text-[10px] bg-dark text-primary px-1 rounded font-bold">
              ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Informative Hint Pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-dark/90  -stone-800 text-[11px]  shadow-md backdrop-blur-md pointer-events-none">
        Move mouse left/right of slider to customize each side
      </div>

      {/* 3. Draggable Divider Handle */}
      <div
        className="absolute top-0 bottom-0 z-30 w-1 bg-primary shadow-2xl cursor-ew-resize flex items-center justify-center pointer-events-auto"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="w-8 h-8 rounded-full bg-primary  -2 -stone-900 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
