"use client";

import { api, type Product } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
// import { ProductsSection } from "@/components/admin/sections/products-section";

const fetchProducts = () => api.getProducts({});

export default function ProductsPage() {
  // const products = useResource<Product[]>(fetchProducts, []);
  // return <ProductsSection products={products.data} reload={products.reload} />;

  return null

}