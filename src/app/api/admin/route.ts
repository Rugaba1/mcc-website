import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const [
      productCount,
      orderCount,
      customerCount,
      pendingOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.count({
        where: { status: { in: ["PENDING", "PAID", "PROCESSING"] } },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { placedAt: "desc" },
        include: { user: true, items: true },
      }),
    ]);

    return NextResponse.json({
      summary: {
        products: productCount,
        orders: orderCount,
        customers: customerCount,
        pendingOrders,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        grandTotal: Number(order.grandTotal),
        customerName: order.user
          ? `${order.user.firstName} ${order.user.lastName ?? ""}`.trim()
          : (order.guestEmail ?? "Guest"),
        placedAt: order.placedAt,
        itemCount: order.items.length,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin:", error);
    return NextResponse.json(
      { error: "Failed to load admin summary" },
      { status: 500 },
    );
  }
}
