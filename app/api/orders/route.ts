import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { invoicePath } from "@/lib/invoices/invoice";
import type { Prisma } from "@/lib/generated/prisma/client";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const GET = withPermission(PERM.ORDERS_VIEW)(
  async (req: NextRequest) => {
  try {
    const pagination = parsePagination(req.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    const statusInput = req.nextUrl.searchParams.get("status");
    const paymentInput = req.nextUrl.searchParams.get("payment");
    const unpaidOnly = req.nextUrl.searchParams.get("unpaid") === "1";
    const statuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
    const paymentStatuses = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
    const status = statuses.find((value) => value === statusInput);
    const paymentStatus = paymentStatuses.find((value) => value === paymentInput);
    if ((statusInput && !status) || (paymentInput && !paymentStatus)) {
      return NextResponse.json({ error: "Invalid order filter" }, { status: 400 });
    }
    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(unpaidOnly
        ? {
            status: { notIn: ["CANCELLED", "REFUNDED"] },
            paymentStatus: { notIn: ["PAID", "REFUNDED"] },
          }
        : {}),
      ...(pagination.search
        ? {
            OR: [
              { orderNumber: { contains: pagination.search } },
              { shipFullName: { contains: pagination.search } },
              { guestEmail: { contains: pagination.search } },
              { guestPhone: { contains: pagination.search } },
            ],
          }
        : {}),
    };
    let total = 0;
    let page = pagination.page;
    if (pagination.requested) {
      total = await prisma.order.count({ where });
      page = pageForTotal(total, pagination.page, pagination.pageSize).page;
    }
    const orders = await prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      ...(pagination.requested
        ? { skip: (page - 1) * pagination.pageSize, take: pagination.pageSize }
        : {}),
      select: {
        user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
        items: { select: { id: true } },
        invoices: {
          select: { id: true, kind: true, number: true, issuedAt: true },
          orderBy: { issuedAt: "asc" },
        },
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        grandTotal: true,
        guestEmail: true,
        guestPhone: true,
        placedAt: true,
      },
    });

    const items = orders.map((order) => ({
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
        invoices: order.invoices.map((inv) => ({
          id: inv.id,
          kind: inv.kind,  
          number: inv.number,
          issuedAt: inv.issuedAt,
          url: inv.number ? invoicePath(inv.number) : null,
        })),
      }));
    return NextResponse.json(
      pagination.requested
        ? paginatedResult(items, total, page, pagination.pageSize)
        : items,
    );
  } catch (error) {
    console.error("GET /api/orders:", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
  },
);
