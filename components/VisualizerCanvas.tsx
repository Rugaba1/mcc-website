"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { SceneDefinition, SurfaceDefinition } from "../data/scenes";
import { SelectionMap } from "../types/visualizer";
import { LuxuryLoading } from "@/components/luxury-loading";

interface VisualizerCanvasProps {
  scene: SceneDefinition;
  selections: SelectionMap;
  activeSurfaceSortOrder: number;
  onSelectSurface: (sortOrder: number) => void;
  isZoomMode: boolean;
  className?: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  scene,
  selections,
  activeSurfaceSortOrder,
  onSelectSurface,
  isZoomMode,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Loaded image references
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const maskImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const sampleLayerImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const swatchImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoveredSurface, setHoveredSurface] = useState<SurfaceDefinition | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Pan / Zoom state
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Preload base image, masks, and sample layers on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadPromises: Promise<unknown>[] = [];

    // 1. Base Image
    const baseImg = new Image();
    const basePromise = new Promise((resolve, reject) => {
      baseImg.onload = () => resolve(baseImg);
      baseImg.onerror = reject;
      baseImg.src = scene.baseImage;
    });
    baseImageRef.current = baseImg;
    loadPromises.push(basePromise);

    // 2. Surface Masks (1 to 11)
    scene.surfaces.forEach((surf) => {
      const maskImg = new Image();
      const maskPromise = new Promise((resolve) => {
        maskImg.onload = () => {
          maskImagesRef.current.set(surf.sortOrder, maskImg);
          resolve(maskImg);
        };
        maskImg.onerror = () => resolve(null);
        maskImg.src = surf.mask;
      });
      loadPromises.push(maskPromise);
    });

    // 3. Preload static sample layers
    scene.surfaces.forEach((surf) => {
      if (surf.sampleLayer) {
        const layerSrc = surf.sampleLayer;
        const layerImg = new Image();
        const layerPromise = new Promise((resolve) => {
          layerImg.onload = () => {
            sampleLayerImagesRef.current.set(layerSrc, layerImg);
            resolve(layerImg);
          };
          layerImg.onerror = () => resolve(null);
          layerImg.src = layerSrc;
        });
        loadPromises.push(layerPromise);
      }
    });

    // Create offscreen canvas for hit testing
    const offscreen = document.createElement("canvas");
    offscreenCanvasRef.current = offscreen;

    Promise.all(loadPromises)
      .then(() => {
        if (isMounted) setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading visualizer assets:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [scene.id, scene.baseImage, scene.surfaces]);

  // Main Render Function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = baseImageRef.current;
    if (!baseImg || !baseImg.complete || !baseImg.naturalWidth) return;

    const width = scene.originalSize.width;
    const height = scene.originalSize.height;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Pan and Zoom
    if (isZoomMode) {
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-width / 2 + panOffset.x, -height / 2 + panOffset.y);
    }

    // 1. Draw Base Room Image
    ctx.drawImage(baseImg, 0, 0, width, height);

    // 2. Draw Applied Texture Layers
    scene.surfaces.forEach((surf) => {
      const sel = selections[surf.sortOrder];
      if (!sel) return;

      const maskImg = maskImagesRef.current.get(surf.sortOrder);
      const swatchImg = swatchImagesRef.current.get(sel.product.swatchUrl);

      // Check if this surface has a specialized pre-rendered raytraced layer
      const sampleLayerImg = surf.sampleLayer
        ? sampleLayerImagesRef.current.get(surf.sampleLayer)
        : null;

      if (sampleLayerImg && sampleLayerImg.complete && sel.product.id === surf.sampleProductId) {
        // Use genuine pre-rendered raytraced layer
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(sampleLayerImg, 0, 0, width, height);
        ctx.restore();
      } else if (maskImg && maskImg.complete) {
        // Render surface based on category
        const scratchCanvas = document.createElement("canvas");
        scratchCanvas.width = width;
        scratchCanvas.height = height;
        const sCtx = scratchCanvas.getContext("2d");
        if (!sCtx) return;

        // Draw mask as clipping base
        sCtx.drawImage(maskImg, 0, 0, width, height);
        sCtx.globalCompositeOperation = "source-in";

        if (sel.productType === "paint") {
          // A. PAINT (Smooth paint finish, no harsh repeats)
          // Extract RGB from specifier if present (e.g. COLOR(RGB(219,199,189)))
          const rgbMatch = sel.product.specifier.match(/RGB\((\d+),(\d+),(\d+)\)/);
          if (rgbMatch) {
            sCtx.fillStyle = `rgb(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]})`;
            sCtx.fillRect(0, 0, width, height);
          } else if (swatchImg && swatchImg.complete) {
            sCtx.drawImage(swatchImg, 0, 0, width, height);
          } else {
            sCtx.fillStyle = "#e5e5e5";
            sCtx.fillRect(0, 0, width, height);
          }

          // Composite smoothly with room lighting
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 0.88;
          ctx.drawImage(scratchCanvas, 0, 0);
          ctx.restore();
        } else if (sel.productType === "counter" || surf.type === "COUNTER") {
          // B. COUNTERTOP / SLAB (Natural large-scale stone slab)
          if (swatchImg && swatchImg.complete) {
            // Scale swatch up significantly (e.g. 600px) so it looks like real stone veining
            const tilePatternCanvas = document.createElement("canvas");
            const slabSize = 650;
            tilePatternCanvas.width = slabSize;
            tilePatternCanvas.height = slabSize;
            const pCtx = tilePatternCanvas.getContext("2d");
            if (pCtx) {
              pCtx.drawImage(swatchImg, 0, 0, slabSize, slabSize);
              const pattern = sCtx.createPattern(tilePatternCanvas, "repeat");
              if (pattern) {
                sCtx.fillStyle = pattern;
                sCtx.fillRect(0, 0, width, height);
              }
            }
          }

          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 0.94;
          ctx.drawImage(scratchCanvas, 0, 0);
          ctx.restore();
        } else {
          // C. TILE SURFACES (Floors, Walls, Backsplash)
          if (swatchImg && swatchImg.complete) {
            // Realistic aspect scale based on tile ratio and pattern
            const ratio = sel.pattern?.ratio || (sel.product as any).ratio || "1x1";
            const tileW = 280;
            const tileH = ratio === "1x1" ? 280 : ratio === "Mosaic" ? 140 : 160;

            const patternTile = document.createElement("canvas");
            patternTile.width = tileW;
            patternTile.height = tileH;
            const pCtx = patternTile.getContext("2d");
            if (pCtx) {
              // Draw tile swatch
              pCtx.drawImage(swatchImg, 1, 1, tileW - 2, tileH - 2);

              // Draw grout with dynamic color based on selected grout
              const groutColorName = sel.grout?.color?.toLowerCase() || "silver";
              let groutColor = "rgba(180, 175, 168, 0.75)";
              if (groutColorName.includes("white") || groutColorName.includes("bright")) {
                groutColor = "rgba(245, 245, 245, 0.85)";
              } else if (groutColorName.includes("black") || groutColorName.includes("charcoal") || groutColorName.includes("raven")) {
                groutColor = "rgba(40, 40, 40, 0.85)";
              } else if (groutColorName.includes("sand") || groutColorName.includes("beige") || groutColorName.includes("sauterne")) {
                groutColor = "rgba(210, 190, 165, 0.8)";
              } else if (groutColorName.includes("smoke") || groutColorName.includes("pewter")) {
                groutColor = "rgba(130, 130, 130, 0.8)";
              }

              pCtx.strokeStyle = groutColor;
              pCtx.lineWidth = 2.5;
              pCtx.strokeRect(0, 0, tileW, tileH);

              const pattern = sCtx.createPattern(patternTile, "repeat");
              if (pattern) {
                sCtx.fillStyle = pattern;
                sCtx.fillRect(0, 0, width, height);
              }
            }
          }

          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 0.95;
          ctx.drawImage(scratchCanvas, 0, 0);
          ctx.restore();
        }
      }
    });

    // 3. Draw Hover Highlight ONLY when actively hovering over the surface with the mouse!
    // (Never when idle, eliminating the permanent greenish overlay)
    if (hoveredSurface) {
      const mask = maskImagesRef.current.get(hoveredSurface.sortOrder);
      if (mask && mask.complete) {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        // Subtle amber tint overlay for clean visual feedback
        ctx.globalAlpha = 0.6;
        ctx.drawImage(mask, 0, 0, width, height);
        ctx.restore();
      }
    }

    ctx.restore();
  }, [scene, selections, hoveredSurface, isZoomMode, zoomScale, panOffset]);

  useEffect(() => {
    if (!isLoading) renderCanvas();
  }, [isLoading, renderCanvas]);

  // Preload swatches whenever selections change
  useEffect(() => {
    scene.surfaces.forEach((surf) => {
      const sel = selections[surf.sortOrder];
      if (!sel) return;

      const swatchUrl = sel.product.swatchUrl;
      if (!swatchImagesRef.current.has(swatchUrl)) {
        const sImg = new Image();
        sImg.onload = () => {
          swatchImagesRef.current.set(swatchUrl, sImg);
          renderCanvas();
        };
        sImg.src = swatchUrl;
      }
    });

    renderCanvas();
  }, [selections, renderCanvas]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Hit-testing using offscreen pixel sampling
  const hitTestSurface = (clientX: number, clientY: number): SurfaceDefinition | null => {
    const canvas = canvasRef.current;
    const offscreen = offscreenCanvasRef.current;
    if (!canvas || !offscreen) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;

    if (isZoomMode) {
      x = (x - canvas.width / 2 - panOffset.x * zoomScale) / zoomScale + canvas.width / 2;
      y = (y - canvas.height / 2 - panOffset.y * zoomScale) / zoomScale + canvas.height / 2;
    }

    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return null;

    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return null;

    const surfaces = scene.surfaces;
    for (let i = surfaces.length - 1; i >= 0; i--) {
      const surf = surfaces[i];
      const mask = maskImagesRef.current.get(surf.sortOrder);
      if (!mask || !mask.complete) continue;

      const maskWidth = mask.naturalWidth || mask.width;
      const maskHeight = mask.naturalHeight || mask.height;

      if (offscreen.width !== maskWidth || offscreen.height !== maskHeight) {
        offscreen.width = maskWidth;
        offscreen.height = maskHeight;
      }

      const mx = Math.floor((x / canvas.width) * maskWidth);
      const my = Math.floor((y / canvas.height) * maskHeight);

      if (mx >= 0 && mx < maskWidth && my >= 0 && my < maskHeight) {
        offCtx.clearRect(0, 0, maskWidth, maskHeight);
        offCtx.drawImage(mask, 0, 0);
        const pixel = offCtx.getImageData(mx, my, 1, 1).data;
        if (pixel[3] > 10 || pixel[0] + pixel[1] + pixel[2] > 1) {
          return surf;
        }
      }
    }

    return null;
  };

  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (isZoomMode && isDragging) {
      const deltaX = (e.clientX - dragStartRef.current.x) / zoomScale;
      const deltaY = (e.clientY - dragStartRef.current.y) / zoomScale;
      setPanOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const hit = hitTestSurface(e.clientX, e.clientY);
    if (hit?.sortOrder !== hoveredSurface?.sortOrder) {
      setHoveredSurface(hit);
    }
  };

  const handleMouseLeave = () => {
    setHoveredSurface(null);
    setCursorPos(null);
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isZoomMode && isDragging) return;
    const hit = hitTestSurface(e.clientX, e.clientY);
    if (hit) {
      onSelectSurface(hit.sortOrder);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isZoomMode) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!isZoomMode) return;
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoomScale((prev) => Math.min(Math.max(prev + zoomDelta, 1), 3.5));
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-full flex items-center justify-center bg-inverse select-none overflow-hidden ${className || ""}`}
    >
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-inverse/80 backdrop-blur-sm">
          <LuxuryLoading
            label="Loading scene"
            className="min-h-full bg-transparent text-inverse-foreground"
          />
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full  object-contain transition-all duration-75 ${isZoomMode ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"
          }`}
        style={{ aspectRatio: "2000 / 1150" }}
      />

      {/* Surface Name Tooltip near cursor */}
      {hoveredSurface && cursorPos && !isDragging && (
        <div
          className="pointer-events-none absolute z-30 px-3 py-1.5 bg-inverse/90 text-inverse-foreground border border-inverse-border shadow-xl text-xs font-semibold backdrop-blur-md transition-opacity"
          style={{
            left: `${cursorPos.x + 16}px`,
            top: `${cursorPos.y + 16}px`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2  bg-primary animate-pulse" />
            <span>{hoveredSurface.name}</span>
          </div>
          <span className="text-[10px]  font-normal uppercase tracking-wider block mt-0.5">
            {hoveredSurface.type}
          </span>
          {selections[hoveredSurface.sortOrder] && (
            <p className="text-[11px] text-primary font-normal mt-0.5">
              Applied: {selections[hoveredSurface.sortOrder]?.product.name}
            </p>
          )}
        </div>
      )}

      {/* Surface indicator badge at top left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-inverse/80 text-inverse-foreground border border-inverse-border backdrop-blur-md text-xs shadow-md">
        <span className="w-2 h-2  bg-success" />
        <span className="font-medium ">{scene.name}</span>
        <span className="">•</span>
        <span>Surface {activeSurfaceSortOrder} / 11</span>
      </div>
    </div>
  );
};
