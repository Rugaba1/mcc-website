import {
  TileProduct,
  PaintProduct,
  CounterProduct,
  CabinetProduct,
  GroutColor,
  TilePattern,
} from "../data/catalog";

export type AnyProduct = TileProduct | PaintProduct | CounterProduct | CabinetProduct;

export interface SurfaceSelection {
  sortOrder: number;
  product: AnyProduct;
  productType: "tile" | "paint" | "counter" | "cabinet";
  grout?: GroutColor;
  pattern?: TilePattern;
  rotation?: number; // 0, 45, 90, 135
  layerUrl?: string;
}

export type SelectionMap = Record<number, SurfaceSelection | null>;

export interface VisualizerState {
  leftSelections: SelectionMap;
  rightSelections: SelectionMap;
  activeSide: "left" | "right";
  activeSurfaceSortOrder: number;
  isCompareMode: boolean;
  isZoomMode: boolean;
  zoomScale: number;
}
