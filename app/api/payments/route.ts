import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { customerName, userNameSelect } from "@/lib/order-mapper";
import type { Prisma } from "@/lib/generated/prisma/client";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const runtime = "nodejs";

export const GET = withPermission(PERM.PAYMENTS_VIEW)(
  async (request: NextRequest) => {
  try {
    const pagination = parsePagination(request.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    const statusInput = request.nextUrl.searchParams.get("status");
    const methodInput = request.nextUrl.searchParams.get("method");
    const validStatuses = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
    const validMethods = ["MTN_MOMO", "AIRTEL_MONEY", "CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY"] as const;
    const status = validStatuses.find((value) => value === statusInput);
    const method = validMethods.find((value) => value === methodInput);
    if ((statusInput && !status) || (methodInput && !method)) {
      return NextResponse.json({ error: "Invalid payment filter" }, { status: 400 });
    }
    const where: Prisma.PaymentWhereInput = {
      ...(status ? { status } : {}),
      ...(method ? { method } : {}),
      ...(pagination.search
        ? {
            OR: [
              { providerRef: { contains: pagination.search } },
              { payerPhone: { contains: pagination.search } },
              { order: { orderNumber: { contains: pagination.search } } },
              { order: { shipFullName: { contains: pagination.search } } },
            ],
          }
        : {}),
    };
    let total = 0;
    let page = pagination.page;
    let paginationMeta: { total: number; page: number; pageSize: number } | null = null;
    if (pagination.requested) {
      total = await prisma.payment.count({ where });
      page = pageForTotal(total, pagination.page, pagination.pageSize).page;
      paginationMeta = { total, page, pageSize: pagination.pageSize };
    }
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(paginationMeta
        ? { skip: (page - 1) * pagination.pageSize, take: pagination.pageSize }
        : {}),
      include: {
        order: {
          select: {
            orderNumber: true,
            shipFullName: true,
            user: { select: userNameSelect },
            grandTotal: true,
          },
        },
      },
    });

    const items = payments.map((p) => ({
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
        orderTotal: Number(p.order.grandTotal),
        refundedAmount: Number(p.refundedAmount),
        refundedAt: p.refundedAt?.toISOString() ?? null,
        refundReason: p.refundReason,
        note: p.note,
        proofUrl: p.proofUrl,
      }));
    return NextResponse.json(
      paginationMeta
        ? paginatedResult(items, total, page, pagination.pageSize)
        : items,
    );
  } catch (e) {
    console.error("Payments list error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
