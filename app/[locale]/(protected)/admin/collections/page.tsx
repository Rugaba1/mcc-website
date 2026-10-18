"use client";

import { api, type Collection, type Product } from "@/lib/api";
import { CollectionsSection } from "@/components/admin/sections/collections-section";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";



export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const fetchCollecctions = async () => {
    try {
      setLoading(true)
      await Promise.all([api.getCollections().then((data) => setCollections(data)), api.getProducts({}).then((data) => setProducts(data.products))])
    } catch (error) {

    } finally {
      setLoading(false)
    }

  }
  useEffect(() => {
    fetchCollecctions()

  }, [])
  return (
    <>{loading ? <Loader2 className="animate-spin" /> : <CollectionsSection collections={collections} products={products} reload={fetchCollecctions} />}</>
  );
}