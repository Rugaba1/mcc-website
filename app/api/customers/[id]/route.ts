import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { ROLE_IDS } from "@/lib/constants";

export const GET = withPermission(PERM.CUSTOMERS_VIEW)(
  async (_req: NextRequest, context) => {
  try {
    const id = Number((await context.params!).id);
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

    const guestOrders = await prisma.order.findMany({
      where: { guestEmail: customer.email },
      include: { items: true, payments: true },
      orderBy: { placedAt: "desc" },
    });
    const customerOrders = [
      ...customer.orders,
      ...guestOrders,
    ].sort((left, right) => right.placedAt.getTime() - left.placedAt.getTime());

    return NextResponse.json({
      ...customer,
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce(
        (total, order) => total + Number(order.grandTotal),
        0,
      ),
      lastOrderAt: customerOrders[0]?.placedAt ?? null,
      orders: customerOrders.map((order) => ({
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
  },
);
