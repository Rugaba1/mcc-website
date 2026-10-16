"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ALL_ROOM_SCENES, DEFAULT_SCENE, SceneDefinition } from "@/data/scenes";
import { TILES_CATALOG, GROUT_CATALOG, PATTERNS_CATALOG, TileProduct } from "@/data/catalog";
import { SelectionMap, SurfaceSelection } from "@/types/visualizer";
import { HeaderMenu } from "@/components/HeaderMenu";
import { SurfaceTabs } from "@/components/SurfaceTabs";
import { VisualizerCanvas } from "@/components/VisualizerCanvas";
import { CompareSlider } from "@/components/CompareSlider";
import { ProductPicker } from "@/components/ProductPicker";
import { AppliedSummary } from "@/components/AppliedSummary";
import { RoomScenesModal } from "@/components/RoomScenesModal";
import { fetchVisualizerTiles, fetchVisualizerScenes, findTileInList } from "@/lib/visualizer-adapter";

export default function VisualizerPage() {
  // Current active room scene
  const [currentScene, setCurrentScene] = useState<SceneDefinition>(DEFAULT_SCENE);
  const [allScenes, setAllScenes] = useState<SceneDefinition[]>(ALL_ROOM_SCENES);
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState<boolean>(false);

  // Dynamic database tiles
  const [dbTiles, setDbTiles] = useState<TileProduct[]>([]);
  const [isLoadingTiles, setIsLoadingTiles] = useState<boolean>(true);

  // Main design (Side A) selections
  const [leftSelections, setLeftSelections] = useState<SelectionMap>(() => {
    const init: SelectionMap = {};
    DEFAULT_SCENE.surfaces.forEach((s) => {
      init[s.sortOrder] = null;
    });
    return init;
  });

  // Secondary design (Side B for Compare mode)
  const [rightSelections, setRightSelections] = useState<SelectionMap>(() => {
    const init: SelectionMap = {};
    DEFAULT_SCENE.surfaces.forEach((s) => {
      init[s.sortOrder] = null;
    });
    return init;
  });

  // Active compare side being edited ("left" | "right")
  const [activeSide, setActiveSide] = useState<"left" | "right">("left");

  // History for Undo / Redo
  const [history, setHistory] = useState<{ left: SelectionMap; right: SelectionMap }[]>([
    { left: leftSelections, right: rightSelections },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Active UI modes & surface
  const [activeSurfaceSortOrder, setActiveSurfaceSortOrder] = useState<number>(() => {
    return DEFAULT_SCENE.surfaces[0]?.sortOrder || 1;
  });
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [isZoomMode, setIsZoomMode] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [initialFilter, setInitialFilter] = useState<string>("");

  // Determine current active selections based on activeSide
  const currentSelections = isCompareMode && activeSide === "right" ? rightSelections : leftSelections;

  // Serialize selections to sel string
  const getSelString = useCallback((selections: SelectionMap) => {
    const arr = currentScene.surfaces.map((s) => {
      const sel = selections[s.sortOrder];
      if (!sel) return "-1";
      return `${sel.product.id}(${sel.grout?.id || "-1"},${sel.rotation === 0 ? "-1" : "25425" + (2 + ((sel.rotation || 0) / 45))})`;
    });
    return arr.join(",");
  }, [currentScene]);

  // Load database tiles & scenes, and handle deep-linking (?tile=, ?sku=, ?product=, ?scene=)
  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchVisualizerTiles(), fetchVisualizerScenes()]).then(([tiles, scenes]) => {
      if (!isMounted) return;

      if (tiles && tiles.length > 0) {
        setDbTiles(tiles);
      }
      if (scenes && scenes.length > 0) {
        setAllScenes(scenes);
      }
      setIsLoadingTiles(false);

      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const sceneParam = params.get("scene") || params.get("room");
      const skuParam = params.get("sku") || params.get("SKU");
      const productParam = params.get("product") || params.get("tile");
      const surfaceParam = params.get("surface");

      // 1. Resolve Scene
      let activeScn = DEFAULT_SCENE;
      const scenesList = scenes && scenes.length > 0 ? scenes : ALL_ROOM_SCENES;
      if (sceneParam) {
        const found = scenesList.find(
          (s) =>
            s.id.toLowerCase() === sceneParam.toLowerCase() ||
            s.name.toLowerCase().includes(sceneParam.toLowerCase())
        );
        if (found) {
          activeScn = found;
          setCurrentScene(found);
        }
      }

      // 2. Resolve Target Surface (e.g. surface=wall or surface=floor)
      let targetSortOrder = activeScn.surfaces[0]?.sortOrder || 1;
      if (surfaceParam) {
        const foundSurf = activeScn.surfaces.find(
          (s) =>
            s.name.toLowerCase() === surfaceParam.toLowerCase() ||
            s.category.toLowerCase() === surfaceParam.toLowerCase() ||
            s.type.toLowerCase() === surfaceParam.toLowerCase()
        );
        if (foundSurf) targetSortOrder = foundSurf.sortOrder;
      }

      // 3. Resolve Product from Database Tiles
      const query = (skuParam || productParam || "").trim().toLowerCase().replace(/^\^/, "");
      const collectionParam = params.get("collection");
      if (collectionParam) {
        setInitialFilter(collectionParam);
      }

      if (query) {
        const catalogToSearch = tiles && tiles.length > 0 ? tiles : TILES_CATALOG;
        const matchedTile = findTileInList(catalogToSearch, query);

        if (matchedTile) {
          setActiveSurfaceSortOrder(targetSortOrder);
          const sel: SurfaceSelection = {
            sortOrder: targetSortOrder,
            product: matchedTile,
            productType: "tile",
            grout: GROUT_CATALOG[0],
            pattern: PATTERNS_CATALOG[0],
            rotation: 0,
            layerUrl: activeScn.surfaces.find((s) => s.sortOrder === targetSortOrder)?.sampleLayer,
          };
          setLeftSelections((prev) => ({ ...prev, [targetSortOrder]: sel }));
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync hash in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const selString = getSelString(leftSelections);
      const hash = `#visualizer/spec/${encodeURIComponent(currentScene.specifier)}/sel/${selString}`;
      window.history.replaceState(null, "", hash);
      setShareUrl(window.location.href);
    }
  }, [leftSelections, currentScene, getSelString]);

  // Handle switching room scene
  const handleSelectScene = (newScene: SceneDefinition) => {
    setCurrentScene(newScene);
    const newLeft: SelectionMap = {};
    const newRight: SelectionMap = {};
    newScene.surfaces.forEach((s) => {
      newLeft[s.sortOrder] = null;
      newRight[s.sortOrder] = null;
    });
    setLeftSelections(newLeft);
    setRightSelections(newRight);
    setActiveSurfaceSortOrder(newScene.surfaces[0]?.sortOrder || 1);
    setHistory([{ left: newLeft, right: newRight }]);
    setHistoryIndex(0);
  };

  // Push new state to undo/redo history
  const recordHistory = (newLeft: SelectionMap, newRight: SelectionMap) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({ left: newLeft, right: newRight });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setLeftSelections(history[nextIdx].left);
      setRightSelections(history[nextIdx].right);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setLeftSelections(history[nextIdx].left);
      setRightSelections(history[nextIdx].right);
    }
  };

  // Apply product to surface on active side
  const handleApply = (selection: SurfaceSelection) => {
    if (isCompareMode && activeSide === "right") {
      const updatedRight = { ...rightSelections, [selection.sortOrder]: selection };
      setRightSelections(updatedRight);
      recordHistory(leftSelections, updatedRight);
    } else {
      const updatedLeft = { ...leftSelections, [selection.sortOrder]: selection };
      setLeftSelections(updatedLeft);
      recordHistory(updatedLeft, rightSelections);
    }
  };

  // Remove customization from surface on active side
  const handleRemove = (sortOrder: number) => {
    if (isCompareMode && activeSide === "right") {
      const updatedRight = { ...rightSelections, [sortOrder]: null };
      setRightSelections(updatedRight);
      recordHistory(leftSelections, updatedRight);
    } else {
      const updatedLeft = { ...leftSelections, [sortOrder]: null };
      setLeftSelections(updatedLeft);
      recordHistory(updatedLeft, rightSelections);
    }
  };

  // Clear all customizations on active side
  const handleClearAll = () => {
    const cleared: SelectionMap = {};
    currentScene.surfaces.forEach((s) => {
      cleared[s.sortOrder] = null;
    });

    if (isCompareMode && activeSide === "right") {
      setRightSelections(cleared);
      recordHistory(leftSelections, cleared);
    } else {
      setLeftSelections(cleared);
      recordHistory(cleared, rightSelections);
    }
  };

  // Quick apply tile to a surface
  const handleQuickApply = (tile: TileProduct, surfaceSortOrder: number) => {
    setActiveSurfaceSortOrder(surfaceSortOrder);
    const sel: SurfaceSelection = {
      sortOrder: surfaceSortOrder,
      product: tile,
      productType: "tile",
      grout: GROUT_CATALOG[0],
      pattern: PATTERNS_CATALOG[0],
      rotation: 0,
      layerUrl: currentScene.surfaces.find((s) => s.sortOrder === surfaceSortOrder)?.sampleLayer,
    };
    handleApply(sel);
  };

  // Toggle Compare mode
  const handleToggleCompare = () => {
    if (!isCompareMode) {
      setIsCompareMode(true);
      setIsZoomMode(false);
      setActiveSide("left");
    } else {
      setIsCompareMode(false);
    }
  };

  const activeSurface =
    currentScene.surfaces.find((s) => s.sortOrder === activeSurfaceSortOrder) ||
    currentScene.surfaces[0];

  return (
    <div className="flex flex-col h-[90vh]  mt-20 w-screen bg-dark text-ivory/70 overflow-hidden font-sans">
      {/* 1. Top Navigation Bar */}
      <HeaderMenu
        sceneName={currentScene.name}
        isCompareMode={isCompareMode}
        onToggleCompare={handleToggleCompare}
        isZoomMode={isZoomMode}
        onToggleZoom={() => {
          setIsZoomMode(!isZoomMode);
          if (!isZoomMode) setIsCompareMode(false);
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onOpenRooms={() => setIsRoomsModalOpen(true)}
        shareUrl={shareUrl}
        dbTiles={dbTiles}
        onQuickApplyProduct={handleQuickApply}
      />

      {/* 2. Surface Selector Bar */}
      <SurfaceTabs
        surfaces={currentScene.surfaces}
        activeSurfaceSortOrder={activeSurfaceSortOrder}
        onSelectSurface={(sortOrder) => setActiveSurfaceSortOrder(sortOrder)}
        selections={currentSelections}
      />

      {/* 3. Main Workspace: Canvas Stage + Product Catalog Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Canvas Visualizer Stage (Left / Center) */}
        <main className="flex-1 h-full min-h-[350px] relative bg-dark flex items-center justify-center p-2 lg:p-4">
          <div className="w-full h-full max-w-[1400px] max-h-[850px] relative rounded-xl overflow-hidden shadow-2xl border border-stone-800 bg-dark">
            {isCompareMode ? (
              <CompareSlider
                scene={currentScene}
                leftSelections={leftSelections}
                rightSelections={rightSelections}
                activeSide={activeSide}
                onSelectSide={(side) => setActiveSide(side)}
                activeSurfaceSortOrder={activeSurfaceSortOrder}
                onSelectSurface={(so) => setActiveSurfaceSortOrder(so)}
              />
            ) : (
              <VisualizerCanvas
                scene={currentScene}
                selections={leftSelections}
                activeSurfaceSortOrder={activeSurfaceSortOrder}
                onSelectSurface={(so) => setActiveSurfaceSortOrder(so)}
                isZoomMode={isZoomMode}
              />
            )}
          </div>
        </main>

        {/* Product Catalog & Finishes Drawer (Right) */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] h-[45vh] lg:h-full shrink-0 flex flex-col bg-dark z-20 shadow-2xl border-t lg:border-t-0 lg:border-l border-stone-800">
          <ProductPicker
            surface={activeSurface}
            currentSelection={currentSelections[activeSurfaceSortOrder]}
            onApply={handleApply}
            onRemove={handleRemove}
            activeSide={isCompareMode ? activeSide : undefined}
            dbTiles={dbTiles}
            initialFilter={initialFilter}
          />
        </aside>
      </div>

      {/* 4. Bottom Customization & DSL Inspector Footer */}
      <footer className="shrink-0 z-30">
        <AppliedSummary
          scene={currentScene}
          selections={currentSelections}
          onSelectSurface={(so) => setActiveSurfaceSortOrder(so)}
          onRemove={handleRemove}
          onClearAll={handleClearAll}
        />
      </footer>

      {/* 5. 15-Room Scenes Selector Modal */}
      <RoomScenesModal
        isOpen={isRoomsModalOpen}
        onClose={() => setIsRoomsModalOpen(false)}
        currentSceneId={currentScene.id}
        onSelectScene={handleSelectScene}
        allScenes={allScenes}
      />
    </div>
  );
}
