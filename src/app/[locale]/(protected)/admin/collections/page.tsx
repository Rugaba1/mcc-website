"use client";

import { api, type Collection, type Product } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { CollectionsSection } from "@/components/admin/sections/collections-section";

const fetchCollections = () => api.getCollections();
const fetchProducts = () => api.getProducts();

export default function CollectionsPage() {
  const collections = useResource<Collection[]>(fetchCollections, []);
  const products = useResource<Product[]>(fetchProducts, []);
  return (
    <CollectionsSection collections={collections.data} products={products.data} reload={collections.reload} />
  );
}