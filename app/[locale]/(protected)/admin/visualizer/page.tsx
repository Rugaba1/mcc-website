"use client";

import { api, type Product } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { VisualizerSection } from "@/components/admin/sections/visualizer-section";

const fetchProducts = () => api.getProducts({});

export default function VisualizerAdminPage() {
  const products = useResource<{ products: Product[], totalPages: number }>(fetchProducts, { products: [], totalPages: 1 });
  return <VisualizerSection products={products.data.products} reload={products.reload} />;
}