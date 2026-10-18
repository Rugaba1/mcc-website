import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireStaff } from "../../../lib/auth/require-staff";
import { customerName, userNameSelect } from "../../../lib/order-mapper";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error } = await requireStaff(request);
  if (error) return error;

  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        order: {
          select: {
            orderNumber: true,
            shipFullName: true,
            user: { select: userNameSelect },
          },
        },
      },
    });

    return NextResponse.json(
      payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        orderNumber: p.order.orderNumber,
        customerName: customerName(p.order),
        status: p.status,
        method: p.method,
        amount: Number(p.amount), // Decimal -> number
        currency: p.currency,
        provider: p.provider,
        reference: p.providerRef,
        payerPhone: p.payerPhone,
        failureReason: p.failureReason,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    console.error("Payments list error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
