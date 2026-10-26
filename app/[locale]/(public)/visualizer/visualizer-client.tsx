"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ALL_ROOM_SCENES, DEFAULT_SCENE, SceneDefinition } from "@/data/scenes";
import { TILES_CATALOG, GROUT_CATALOG, PATTERNS_CATALOG, TileProduct } from "@/data/catalog";
import { SelectionMap, SurfaceSelection } from "@/types/visualizer";
import { api, apiErrorMessage, type Product } from "@/lib/api";
import { HeaderMenu } from "@/components/HeaderMenu";
import { SurfaceTabs } from "@/components/SurfaceTabs";
import { VisualizerCanvas } from "@/components/VisualizerCanvas";
import { CompareSlider } from "@/components/CompareSlider";
import { ProductPicker } from "@/components/ProductPicker";
import { AppliedSummary } from "@/components/AppliedSummary";
import { RoomScenesModal } from "@/components/RoomScenesModal";
import { dbProductToTileProduct, fetchVisualizerProducts, fetchVisualizerScenes, findTileInList } from "@/lib/visualizer-adapter";

function createDesignPreview(canvas: HTMLCanvasElement | null): string | null {
  if (!canvas || !canvas.width || !canvas.height) return null;
  try {
    const thumbnail = document.createElement("canvas");
    thumbnail.width = 320;
    thumbnail.height = Math.round((canvas.height / canvas.width) * thumbnail.width);
    const context = thumbnail.getContext("2d");
    if (!context) return null;
    context.drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
    const preview = thumbnail.toDataURL("image/webp", 0.55);
    return preview.length <= 60_000 ? preview : null;
  } catch (error) {
    console.error("Could not capture visualizer design preview:", error);
    return null;
  }
}

export default function VisualizerClient({
  initialDesignToken,
}: {
  initialDesignToken?: string;
}) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const setPreviewCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      previewCanvasRef.current = canvas;
    },
    [],
  );
  // Current active room scene
  const [currentScene, setCurrentScene] = useState<SceneDefinition>(DEFAULT_SCENE);
  const [allScenes, setAllScenes] = useState<SceneDefinition[]>(ALL_ROOM_SCENES);
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState<boolean>(false);

  // Dynamic database tiles
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const dbTiles = dbProducts.map(dbProductToTileProduct);
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
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [activeDesignToken, setActiveDesignToken] = useState<string | null>(null);

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

  const handleSaveDesign = async (name: string) => {
    const selected = currentScene.surfaces.flatMap((surface) => [
      leftSelections[surface.sortOrder]
        ? { side: "left" as const, selection: leftSelections[surface.sortOrder]! }
        : null,
      rightSelections[surface.sortOrder]
        ? { side: "right" as const, selection: rightSelections[surface.sortOrder]! }
        : null,
    ]).filter((item): item is { side: "left" | "right"; selection: SurfaceSelection } => item !== null);

    if (selected.some(({ selection }) => selection.productType !== "tile")) {
      toast.error("Saved designs currently support tile selections only.");
      return false;
    }
    if (selected.length === 0) {
      toast.error("Apply at least one tile before saving a design.");
      return false;
    }

    if (!name.trim()) {
      toast.error("Enter a name for this design.");
      return false;
    }

    const variants = dbProducts.flatMap((product) => product.variants ?? []);
    const items: {
      variantId: number;
      surfaceKey: string;
      groutColor: string | null;
      rotation: number;
      layout: string | null;
    }[] = [];
    for (const { side, selection } of selected) {
      const tile = selection.product as TileProduct;
      const size = tile.availableSizes.find(
        (option) => option.id === tile.id || option.sku === tile.sku,
      );
      const variantId = size?.variantId ?? size?.id ?? tile.id;
      if (!variants.some((variant) => variant.id === variantId)) {
        toast.error(`Could not find a database variant for ${tile.name}.`);
        return false;
      }
      items.push({
        variantId,
        surfaceKey: `${side}:${selection.sortOrder}`,
        groutColor: selection.grout?.color ?? null,
        rotation: selection.rotation ?? 0,
        layout: selection.pattern?.name ?? null,
      });
    }

    setIsSavingDesign(true);
    try {
      let sessionId = localStorage.getItem("mcc-visualizer-session");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("mcc-visualizer-session", sessionId);
      }

      const sceneId = currentScene.dbId ?? Number(currentScene.id.replace(/^scene_/, ""));
      const previewImage = createDesignPreview(previewCanvasRef.current);
      if (!previewImage) {
        toast.info("The design will be saved without a preview image.");
      }
      const designData = {
        sceneId: Number.isSafeInteger(sceneId) && sceneId > 0 ? sceneId : null,
        name: name.trim(),
        sessionId,
        items,
        previewImage,
      };
      const result = activeDesignToken
        ? await api.updateVisualizerDesign({
          ...designData,
          shareToken: activeDesignToken,
        })
        : await api.createVisualizerDesign(designData);
      setActiveDesignToken(result.shareToken);
      const url = new URL(window.location.href);
      url.pathname = url.pathname.replace(
        /\/visualizer(?:\/design\/[^/]+)?$/,
        `/visualizer/design/${result.shareToken}`,
      );
      url.searchParams.delete("design");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      setShareUrl(url.toString());
      toast.success("Design saved");
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save design"));
      return false;
    } finally {
      setIsSavingDesign(false);
    }
  };

  // Load database tiles & scenes, and handle deep-linking (?tile=, ?sku=, ?product=, ?scene=)
  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchVisualizerProducts(), fetchVisualizerScenes()]).then(async ([products, scenes]) => {
      if (!isMounted) return;

      const tiles = products.map(dbProductToTileProduct);
      if (products.length > 0) {
        setDbProducts(products);
      }
      if (scenes && scenes.length > 0) {
        setAllScenes(scenes);
      }
      setIsLoadingTiles(false);

      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const sceneParam = params.get("scene") || params.get("room");
      const designToken = params.get("design") ?? initialDesignToken ?? null;
      setActiveDesignToken(designToken);
      const skuParam = params.get("sku") || params.get("SKU");
      const productParam = params.get("product") || params.get("tile");
      const surfaceParam = params.get("surface");

      // 1. Resolve Scene
      let activeScn = DEFAULT_SCENE;
      const scenesList = scenes && scenes.length > 0 ? scenes : ALL_ROOM_SCENES;

      if (designToken) {
        try {
          const design = await api.getVisualizerDesign(designToken);
          if (!isMounted) return;
          setActiveDesignToken(designToken);
          const savedSceneId = design.scene?.id ?? design.sceneId;
          const savedScene = scenesList.find(
            (scene) => scene.dbId === savedSceneId || scene.id === `scene_${savedSceneId}`,
          );
          if (savedScene) activeScn = savedScene;

          const restored: SelectionMap = {};
          const restoredRight: SelectionMap = {};
          activeScn.surfaces.forEach((surface) => {
            restored[surface.sortOrder] = null;
            restoredRight[surface.sortOrder] = null;
          });
          for (const item of design.items ?? []) {
            const variantId = item.variant?.id ?? item.variantId;
            const keyMatch = /^(left|right):(\d+)$/.exec(item.surfaceKey);
            const side = keyMatch?.[1] === "right" ? "right" : "left";
            const surfaceSortOrder = Number(keyMatch?.[2] ?? item.surfaceKey);
            const product = products.find((candidate) =>
              candidate.variants?.some((variant) => variant.id === variantId),
            );
            const variant = product?.variants?.find((candidate) => candidate.id === variantId);
            const surface = activeScn.surfaces.find((candidate) => candidate.sortOrder === surfaceSortOrder);
            if (!product || !variant || !surface) continue;

            const tile = dbProductToTileProduct(product);
            const size = tile.availableSizes.find((option) => option.variantId === variant.id);
            const selectedTile: TileProduct = {
              ...tile,
              id: variant.id,
              size: variant.size,
              sku: variant.sku,
              ratio: size?.ratio ?? tile.ratio,
              specifier: size?.specifier ?? tile.specifier,
              swatchUrl:
                variant.textureUrl ||
                variant.image ||
                size?.swatchUrl ||
                tile.swatchUrl,
            };
            const pattern = PATTERNS_CATALOG.find(
              (candidate) => candidate.name === item.layout || String(candidate.id) === item.layout,
            ) ?? PATTERNS_CATALOG[0];
            const grout = GROUT_CATALOG.find(
              (candidate) => candidate.color === item.groutColor || String(candidate.id) === item.groutColor,
            ) ?? GROUT_CATALOG[0];

            const selection: SurfaceSelection = {
              sortOrder: surface.sortOrder,
              product: selectedTile,
              productType: "tile",
              grout,
              pattern,
              rotation: item.rotation,
              layerUrl: surface.sampleLayer,
            };
            if (side === "right") restoredRight[surface.sortOrder] = selection;
            else restored[surface.sortOrder] = selection;
          }

          const hasRestoredRight = Object.values(restoredRight).some(Boolean);
          setCurrentScene(activeScn);
          setLeftSelections(restored);
          setRightSelections(restoredRight);
          setIsCompareMode(hasRestoredRight);
          setIsZoomMode(false);
          setActiveSide("left");
          setActiveSurfaceSortOrder(
            activeScn.surfaces.find((surface) => restored[surface.sortOrder])?.sortOrder ??
            activeScn.surfaces.find((surface) => restoredRight[surface.sortOrder])?.sortOrder ??
            activeScn.surfaces[0]?.sortOrder ?? 1,
          );
          setHistory([{ left: restored, right: restoredRight }]);
          setHistoryIndex(0);
          setShareUrl(window.location.href);
          return;
        } catch (error) {
          toast.error(apiErrorMessage(error, "Could not load the saved design"));
        }
      }

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
      console.log(dbTiles)

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
  }, [initialDesignToken]);

  // Sync hash in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const selString = getSelString(leftSelections);
      const hash = `#visualizer/spec/${encodeURIComponent(currentScene.specifier)}/sel/${selString}`;
      const url = new URL(window.location.href);
      url.hash = hash;
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      setShareUrl(url.toString());
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
    <div className="flex flex-col sm:h-[90vh] w-screen    overflow-hidden ">
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
        onSaveDesign={handleSaveDesign}
        isSavingDesign={isSavingDesign}
        isExistingDesign={Boolean(activeDesignToken)}
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
        <main className="flex-1 h-full min-h-87.5 relative bg-inverse flex items-center justify-center p-2 lg:p-4">
          <div className="w-full h-full max-w-350 max-h-212.5 relative  overflow-hidden shadow-2xl border ">
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
                onCanvasElement={setPreviewCanvas}
              />
            )}
          </div>
        </main>

        {/* Product Catalog & Finishes Drawer (Right) */}
        <aside className="w-full lg:w-95 xl:w-105 sm:h-[60vh] h-full lg:h-full shrink-0 flex flex-col bg-inverse z-20   ">
          <ProductPicker
            surface={activeSurface}
            currentSelection={currentSelections[activeSurfaceSortOrder]}
            onApply={handleApply}
            onRemove={handleRemove}
            activeSide={isCompareMode ? activeSide : undefined}
            dbTiles={dbProducts}
            initialFilter={initialFilter}
          />
        </aside>
      </div>

      {/* 4. Bottom Customization & DSL Inspector Footer */}
      <footer className="shrink-0 ">
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
