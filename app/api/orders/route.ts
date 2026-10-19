import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getApiUser, hasApiPermission } from "../../../lib/auth/api-access";

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // if (!hasApiPermission(user, "orders.view", "orders.manage")) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    const orders = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      include: {
        user: true,
        items: true,
      },
    });

    return NextResponse.json(
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        grandTotal: Number(order.grandTotal),
        customerName: order.user
          ? `${order.user.firstName} ${order.user.lastName ?? ""}`.trim()
          : (order.guestEmail ?? "Guest"),
        email: order.user?.email ?? order.guestEmail ?? null,
        phone: order.user?.phoneNumber ?? order.guestPhone ?? null,
        placedAt: order.placedAt,
        itemCount: order.items.length,
      })),
    );
  } catch (error) {
    console.error("GET /api/orders:", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}
