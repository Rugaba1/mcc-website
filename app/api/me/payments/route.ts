import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { totalsOf } from "@/lib/payments/sync";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { claims, error } = await requireUser(req);
  if (error) return error;

  try {
    const orders = await prisma.order.findMany({
      where: { userId: claims.userId },
      orderBy: { placedAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        grandTotal: true,
        currency: true,
        placedAt: true,
        payments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            method: true,
            status: true,
            amount: true,
            refundedAmount: true,
            refundedAt: true,
            refundReason: true,
            providerRef: true,
            payerPhone: true,
            note: true,
            failureReason: true,
            provider: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    });

    const summary = {
      totalPaid: 0,
      outstanding: 0,
      pendingCount: 0,
      pendingAmount: 0,
      refunded: 0,
    };

    const mapped = orders.map((o) => {
      const closed = o.status === "CANCELLED" || o.status === "REFUNDED";
      const t = totalsOf(o.payments, Number(o.grandTotal));
      const balanceDue = closed ? 0 : t.balanceDue;
      const pending = o.payments.filter(
        (p) => p.status === "PENDING" || p.status === "AUTHORIZED",
      );

      summary.totalPaid += t.net;
      summary.outstanding += balanceDue;
      summary.refunded += t.refunded;
      summary.pendingCount += pending.length;
      summary.pendingAmount += pending.reduce(
        (s, p) => s + Number(p.amount),
        0,
      );

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        grandTotal: Number(o.grandTotal),
        currency: o.currency,
        placedAt: o.placedAt.toISOString(),
        paid: t.net,
        refunded: t.refunded,
        balanceDue,
        canPay: balanceDue > 0 && pending.length === 0,
        payments: o.payments.map((p) => ({
          id: p.id,
          method: p.method,
          status: p.status,
          amount: Number(p.amount),
          refundedAmount: Number(p.refundedAmount),
          refundedAt: p.refundedAt?.toISOString() ?? null,
          refundReason: p.refundReason,
          providerRef: p.providerRef,
          payerPhone: p.payerPhone,
          note: p.note,
          failureReason: p.failureReason,
          manual: p.provider === "manual",
          paidAt: p.paidAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ summary, orders: mapped });
  } catch (e) {
    console.error("GET /api/me/payments:", e);
    return NextResponse.json(
      { error: "Failed to load payments" },
      { status: 500 },
    );
  }
}
