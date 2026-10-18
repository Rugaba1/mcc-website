import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Provide a user id or email" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: Number(userId) } : { email: email ?? undefined },
      include: {
        addresses: true,
        orders: {
          orderBy: { placedAt: "desc" },
          take: 10,
          include: { items: true, payments: true },
        },
        wishlist: { include: { product: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName ?? ""}`.trim(),
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      isActive: user.isActive,
      createdAt: user.createdAt,
      addresses: user.addresses,
      wishlist: user.wishlist,
      orders: user.orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        grandTotal: Number(order.grandTotal),
        placedAt: order.placedAt,
        items: order.items,
        payments: order.payments,
      })),
    });
  } catch (error) {
    console.error("GET /api/customer:", error);
    return NextResponse.json(
      { error: "Failed to load customer details" },
      { status: 500 },
    );
  }
}
