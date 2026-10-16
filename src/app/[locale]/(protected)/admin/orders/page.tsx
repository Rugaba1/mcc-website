"use client";

import { api, type OrderSummary } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { OrdersSection } from "@/components/admin/sections/orders-section";

const fetchOrders = () => api.getOrders();

export default function OrdersPage() {
  const orders = useResource<OrderSummary[]>(fetchOrders, []);
  return <OrdersSection orders={orders.data} reload={orders.reload} />;
}