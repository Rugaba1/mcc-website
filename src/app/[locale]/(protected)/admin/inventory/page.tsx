"use client";

import { api, type InventoryItem } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { InventorySection } from "@/components/admin/sections/inventory-section";

const fetchInventory = () => api.getInventory();

export default function InventoryPage() {
  const inventory = useResource<InventoryItem[]>(fetchInventory, []);
  return <InventorySection items={inventory.data} reload={inventory.reload} />;
}