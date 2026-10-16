import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasApiPermission } from "@/lib/auth/api-access";
import { ROLE_IDS } from "@/lib/constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasApiPermission(user, "users.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = Number((await params).id);
    if (!Number.isSafeInteger(id) || id < 1)
      return NextResponse.json(
        { error: "Invalid customer id" },
        { status: 400 },
      );

    const customer = await prisma.user.findFirst({
      where: {
        id,
        role: { some: { id: ROLE_IDS.CUSTOMER } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        addresses: true,
        orders: {
          orderBy: { placedAt: "desc" },
          include: { items: true, payments: true },
        },
      },
    });
    if (!customer)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );

    return NextResponse.json({
      ...customer,
      orderCount: customer.orders.length,
      totalSpent: customer.orders.reduce(
        (total, order) => total + Number(order.grandTotal),
        0,
      ),
      lastOrderAt: customer.orders[0]?.placedAt ?? null,
      orders: customer.orders.map((order) => ({
        ...order,
        customerName: `${customer.firstName} ${customer.lastName ?? ""}`.trim(),
        email: customer.email,
        phone: customer.phoneNumber,
        itemCount: order.items.length,
        subtotal: Number(order.subtotal),
        discountTotal: Number(order.discountTotal),
        shippingFee: Number(order.shippingFee),
        taxTotal: Number(order.taxTotal),
        grandTotal: Number(order.grandTotal),
        items: order.items.map((item) => ({
          ...item,
          sqmPerBox: Number(item.sqmPerBox),
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        })),
        payments: order.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
        })),
      })),
    });
  } catch (error) {
    console.error("GET /api/customers/[id]:", error);
    return NextResponse.json(
      { error: "Failed to load customer" },
      { status: 500 },
    );
  }
}
