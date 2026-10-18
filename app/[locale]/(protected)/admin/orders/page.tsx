"use client";

import { api, type OrderSummary } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { OrdersSection } from "@/components/admin/sections/orders-section";
import { useEffect, useState } from "react";
import { Order } from "@/lib/generated/prisma";



export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const fetchOrders = async () => {
    await api.getOrders();

  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return <OrdersSection orders={orders} reload={fetchOrders} />;
}