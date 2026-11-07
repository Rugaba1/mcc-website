"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SceneDefinition } from "../data/scenes";
import { VisualizerCanvas } from "./VisualizerCanvas";
import { SelectionMap } from "../types/visualizer";
import { GripVertical } from "lucide-react";
import { Badge } from "./ui/badge";

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

/* eslint-disable jsx-a11y/no-static-element-interactions -- The visualizer frame only tracks pointer position; its slider handle is keyboard-accessible. */
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

  const handleSliderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    let nextPosition = sliderPosition;

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextPosition = Math.max(0, sliderPosition - step);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextPosition = Math.min(100, sliderPosition + step);
    } else if (event.key === "Home") {
      nextPosition = 0;
    } else if (event.key === "End") {
      nextPosition = 100;
    } else {
      return;
    }

    event.preventDefault();
    setSliderPosition(nextPosition);
    onSelectSide(nextPosition < sliderPosition ? "left" : "right");
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
      window.addEventListener("touchcancel", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
    }
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
      window.removeEventListener("touchcancel", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      role="presentation"
      onMouseMove={handleContainerMouseMove}
      className={`relative w-full h-full flex items-center justify-center bg-inverse overflow-hidden select-none ${className || ""}`}
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



      {/* Informative Hint Pill */}
      <div id="comparison-slider-help" className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-inverse/90 text-inverse-foreground border border-inverse-border text-[11px] backdrop-blur-md pointer-events-none">
        Drag to compare; focus the divider and use arrow keys to adjust.
      </div>

      {/* 3. Draggable Divider Handle */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- This ARIA slider supports pointer, touch, and keyboard input. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Before and after comparison"
        aria-describedby="comparison-slider-help"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPosition)}
        aria-valuetext={`Left design ${Math.round(sliderPosition)} percent, right design ${100 - Math.round(sliderPosition)} percent`}
        className="absolute top-0 bottom-0 z-30 flex w-11 -translate-x-1/2 touch-none cursor-ew-resize items-center justify-center bg-transparent pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={{ left: `${sliderPosition}%` }}
        onClick={(event) => handleMove(event.clientX)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onKeyDown={handleSliderKeyDown}
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-primary shadow-2xl" />
        <div className="z-10 flex h-11 w-11 cursor-grab items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 active:scale-95 active:cursor-grabbing">
          <GripVertical className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
