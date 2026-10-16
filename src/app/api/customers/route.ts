import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasApiPermission } from "@/lib/auth/api-access";
import { ROLE_IDS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasApiPermission(user, "users.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customers = await prisma.user.findMany({
      where: {
        role: { some: { id: ROLE_IDS.CUSTOMER } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        orders: {
          select: { grandTotal: true, placedAt: true },
          orderBy: { placedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      customers.map((customer) => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        createdAt: customer.createdAt,
        orderCount: customer.orders.length,
        totalSpent: customer.orders.reduce(
          (total, order) => total + Number(order.grandTotal),
          0,
        ),
        lastOrderAt: customer.orders[0]?.placedAt ?? null,
      })),
    );
  } catch (error) {
    console.error("GET /api/customers:", error);
    return NextResponse.json(
      { error: "Failed to load customers" },
      { status: 500 },
    );
  }
}
