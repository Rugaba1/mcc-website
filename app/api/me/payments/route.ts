import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";
import { totalsOf } from "@/lib/payments/sync";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const runtime = "nodejs";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const pagination = parsePagination(req.nextUrl.searchParams, 8);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
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

    const dueOrders = mapped.filter(
      (order) =>
        order.balanceDue > 0 ||
        order.payments.some((payment) => payment.status === "PENDING" || payment.status === "AUTHORIZED"),
    );
    const history = mapped
      .flatMap((order) =>
        order.payments.map((payment) => ({
          ...payment,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            currency: order.currency,
          },
        })),
      )
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const total = history.length;
    const { page } = pageForTotal(total, pagination.page, pagination.pageSize);
    const pageRows = history.slice(
      (page - 1) * pagination.pageSize,
      page * pagination.pageSize,
    );
    return NextResponse.json({
      summary,
      orders: dueOrders,
      history: paginatedResult(pageRows, total, page, pagination.pageSize),
    });
  } catch (e) {
    console.error("GET /api/me/payments:", e);
    return NextResponse.json(
      { error: "Failed to load payments" },
      { status: 500 },
    );
  }
});
