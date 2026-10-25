import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { ROLE_IDS } from "@/lib/constants";
import type { Prisma } from "@/lib/generated/prisma/client";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const GET = withPermission(PERM.CUSTOMERS_VIEW)(
  async (req: NextRequest) => {
  try {
    const pagination = parsePagination(req.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    if (pagination.requested) {
      const orderFilter =
        req.nextUrl.searchParams.get("orders") || "buyers";
      const guestBuyerEmails =
        orderFilter === "buyers" || orderFilter === "none"
          ? (
              await prisma.order.findMany({
                where: { guestEmail: { not: null } },
                select: { guestEmail: true },
                distinct: ["guestEmail"],
              })
            )
              .map((order) => order.guestEmail)
              .filter((email): email is string => email !== null)
          : [];
      const customerFilters: Prisma.UserWhereInput[] = [];
      if (orderFilter === "buyers") {
        customerFilters.push({
          OR: [
            { orders: { some: {} } },
            { email: { in: guestBuyerEmails } },
          ],
        });
      } else if (orderFilter === "none") {
        customerFilters.push({
          AND: [
            { orders: { none: {} } },
            { email: { notIn: guestBuyerEmails } },
          ],
        });
      }
      if (pagination.search) {
        customerFilters.push({
          OR: [
            { firstName: { contains: pagination.search } },
            { lastName: { contains: pagination.search } },
            { email: { contains: pagination.search } },
            { phoneNumber: { contains: pagination.search } },
          ],
        });
      }
      const where: Prisma.UserWhereInput = {
        role: { some: { id: ROLE_IDS.CUSTOMER } },
        ...(customerFilters.length ? { AND: customerFilters } : {}),
      };
      const total = await prisma.user.count({ where });
      const { page } = pageForTotal(total, pagination.page, pagination.pageSize);
      const customers = await prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            take: 1,
            orderBy: { placedAt: "desc" },
            select: { placedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      });
      const orders = customers.length
        ? await prisma.order.findMany({
            where: {
              OR: [
                { userId: { in: customers.map((customer) => customer.id) } },
                { guestEmail: { in: customers.map((customer) => customer.email) } },
              ],
            },
            select: {
              userId: true,
              guestEmail: true,
              grandTotal: true,
              placedAt: true,
            },
            orderBy: { placedAt: "desc" },
          })
        : [];
      const ordersByCustomer = new Map<
        number,
        { orderCount: number; totalSpent: number; lastOrderAt: Date | null }
      >();
      const customerIdByEmail = new Map(
        customers.map((customer) => [customer.email.toLowerCase(), customer.id]),
      );
      for (const order of orders) {
        const customerId =
          order.userId ?? customerIdByEmail.get(order.guestEmail?.toLowerCase() ?? "");
        if (customerId === undefined) continue;
        const summary = ordersByCustomer.get(customerId) ?? {
          orderCount: 0,
          totalSpent: 0,
          lastOrderAt: null,
        };
        summary.orderCount += 1;
        summary.totalSpent += Number(order.grandTotal);
        summary.lastOrderAt ??= order.placedAt;
        ordersByCustomer.set(customerId, summary);
      }
      return NextResponse.json(
        paginatedResult(
          customers.map((customer) => ({
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phoneNumber: customer.phoneNumber,
            createdAt: customer.createdAt,
            orderCount:
              ordersByCustomer.get(customer.id)?.orderCount ??
              customer._count.orders,
            totalSpent: ordersByCustomer.get(customer.id)?.totalSpent ?? 0,
            lastOrderAt:
              ordersByCustomer.get(customer.id)?.lastOrderAt ??
              customer.orders[0]?.placedAt ??
              null,
          })),
          total,
          page,
          pagination.pageSize,
        ),
      );
    }
    const customers = await prisma.user.findMany({
      where: {
        role: { some: { id: ROLE_IDS.CUSTOMER } },
        orders: { some: {} },
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
  },
);
