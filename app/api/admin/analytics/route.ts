import { NextResponse } from "next/server";
import type { Prisma } from "@/lib/generated/prisma";
import {
  buildSeries,
  card,
  dayKey,
  dayKeys,
  daysAgo,
  fullName,
  monthKey,
  monthKeys,
  monthsAgoStart,
  num,
  parseDays,
  round,
  titleCase,
  toPie,
} from "@/lib/analytics/helpers";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";

// An order counts as revenue when it is paid and not cancelled/refunded.
const REVENUE_ORDER: Prisma.OrderWhereInput = {
  paymentStatus: "PAID",
  status: { notIn: ["CANCELLED", "REFUNDED"] },
};

// TODO: add permission check (e.g. reports.view) before shipping — right now ANY logged-in user can call this.
export const GET = withAuth(async (request) => {
  try {
    const days = parseDays(request.nextUrl.searchParams);

    const rangeStart = daysAgo(days - 1); // includes today
    const prevStart = daysAgo(days * 2 - 1);
    const monthsStart = monthsAgoStart(11); // 12 months incl. current
    const seriesStart = rangeStart < monthsStart ? rangeStart : monthsStart;

    const inRange = { gte: rangeStart };
    const inPrev = { gte: prevStart, lt: rangeStart };

    const [
      revCur,
      revPrev,
      revAll,
      ordersCur,
      ordersPrev,
      actionNeeded,
      customersTotal,
      customersNew,
      customersPrev,
      customersActive,
      productsActive,
      variantsActive,
      unreadMessages,
      pendingReviews,
      inventoryRows,
      seriesOrders,
      seriesUsers,
      ordersByStatus,
      ordersByFulfillment,
      paymentsByMethod,
      paymentsByStatus,
      topProducts,
      soldItems,
      productsByCategory,
      recentOrders,
      recentCustomers,
      recentPayments,
      recentMessages,
      pendingReviewList,
    ] = await Promise.all([
      // ── cards ──
      prisma.order.aggregate({
        where: { ...REVENUE_ORDER, placedAt: inRange },
        _sum: { grandTotal: true },
        _avg: { grandTotal: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { ...REVENUE_ORDER, placedAt: inPrev },
        _sum: { grandTotal: true },
        _avg: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: REVENUE_ORDER,
        _sum: { grandTotal: true },
      }),
      prisma.order.count({ where: { placedAt: inRange } }),
      prisma.order.count({ where: { placedAt: inPrev } }),
      prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: inRange } }),
      prisma.user.count({ where: { createdAt: inPrev } }),
      prisma.user.count({ where: { lastLogin: inRange } }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.productVariant.count({ where: { active: true } }),
      prisma.contactMessage.count({ where: { status: "NEW" } }),
      prisma.review.count({ where: { approved: false } }),

      // ── inventory (health computed in JS: available = onHand - reserved) ──
      prisma.inventory.findMany({
        where: { variant: { active: true } },
        select: {
          onHandSqm: true,
          reservedSqm: true,
          reorderLevel: true,
          variant: {
            select: {
              id: true,
              sku: true,
              size: true,
              finish: true,
              product: { select: { name: true, image: true } },
            },
          },
        },
      }),

      // ── raw rows for time-series ──
      prisma.order.findMany({
        where: { placedAt: { gte: seriesStart } },
        select: {
          placedAt: true,
          grandTotal: true,
          status: true,
          paymentStatus: true,
        },
      }),
      prisma.user.findMany({
        where: { createdAt: inRange },
        select: { createdAt: true },
      }),

      // ── pies ──
      prisma.order.groupBy({
        by: ["status"],
        where: { placedAt: inRange },
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["fulfillment"],
        where: { placedAt: inRange },
        _count: { _all: true },
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: { status: "PAID", createdAt: inRange },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ["status"],
        where: { createdAt: inRange },
        _count: { _all: true },
      }),

      // ── best sellers + revenue by category ──
      prisma.orderItem.groupBy({
        by: ["productName"],
        where: { order: { ...REVENUE_ORDER, placedAt: inRange } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: "desc" } },
        take: 8,
      }),
      prisma.orderItem.findMany({
        where: { order: { ...REVENUE_ORDER, placedAt: inRange } },
        select: {
          lineTotal: true,
          variant: { select: { product: { select: { categoryLabel: true } } } },
        },
      }),
      prisma.product.groupBy({
        by: ["categoryLabel"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
      }),

      // ── tables ──
      prisma.order.findMany({
        take: 8,
        orderBy: { placedAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillment: true,
          grandTotal: true,
          currency: true,
          placedAt: true,
          guestEmail: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          createdAt: true,
          lastLogin: true,
        },
      }),
      prisma.payment.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          currency: true,
          provider: true,
          createdAt: true,
          order: { select: { orderNumber: true } },
        },
      }),
      prisma.contactMessage.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          projectType: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.review.findMany({
        where: { approved: false },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          title: true,
          createdAt: true,
          product: { select: { name: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    // ── inventory health ──
   const stockList = inventoryRows.map((r) => {
     const onHand = num(r.onHandSqm);
     const reserved = num(r.reservedSqm);
     const reorder = num(r.reorderLevel);
     const available = round(onHand - reserved, 2);
     const state =
       available <= 0
         ? "OUT_OF_STOCK"
         : available <= reorder
           ? "LOW"
           : "IN_STOCK";
     return {
       variantId: r.variant.id,
       sku: r.variant.sku,
       product: r.variant.product.name,
       image: r.variant.product.image,
       size: r.variant.size,
       finish: r.variant.finish,
       onHandSqm: onHand,
       reservedSqm: reserved,
       availableSqm: available,
       reorderLevel: reorder,
       state,
     };
   });
    const outOfStock = stockList.filter((s) => s.state === "OUT_OF_STOCK").length;
    const lowStock = stockList.filter((s) => s.state === "LOW").length;
    const inStock = stockList.length - outOfStock - lowStock;
    const lowStockTable = stockList
      .filter((s) => s.state !== "IN_STOCK")
      .sort((a, b) => a.availableSqm - b.availableSqm)
      .slice(0, 10);

    // ── time series ──
    const isRevenue = (o: { status: string; paymentStatus: string }) =>
      o.paymentStatus === "PAID" && o.status !== "CANCELLED" && o.status !== "REFUNDED";

    const rowValues = (o: (typeof seriesOrders)[number]) => ({
      revenue: isRevenue(o) ? num(o.grandTotal) : 0,
      orders: o.status === "CANCELLED" ? 0 : 1,
    });

    const revenueDaily = buildSeries(
      dayKeys(days),
      ["revenue", "orders"],
      seriesOrders,
      (o) => dayKey(o.placedAt),
      rowValues,
    );
    const revenueMonthly = buildSeries(
      monthKeys(12),
      ["revenue", "orders"],
      seriesOrders,
      (o) => monthKey(o.placedAt),
      rowValues,
    );
    const customersDaily = buildSeries(
      dayKeys(days),
      ["customers"],
      seriesUsers,
      (u) => dayKey(u.createdAt),
      () => ({ customers: 1 }),
    );

    // ── pies ──
    const categoryRevenue = new Map<string, number>();
    for (const item of soldItems) {
      const label = item.variant?.product.categoryLabel ?? "Uncategorized";
      categoryRevenue.set(label, (categoryRevenue.get(label) ?? 0) + num(item.lineTotal));
    }

    // ── cards ──
    const revenue = num(revCur._sum.grandTotal);
    const revenuePrev = num(revPrev._sum.grandTotal);

    const cards = [
      card("revenue", "Revenue", revenue, "currency", revenuePrev),
      card("orders", "Orders", ordersCur, "number", ordersPrev),
      card("avgOrderValue", "Avg. Order Value", num(revCur._avg.grandTotal), "currency", num(revPrev._avg.grandTotal)),
      card("newCustomers", "New Customers", customersNew, "number", customersPrev),
      card("totalCustomers", "Total Customers", customersTotal),
      card("activeCustomers", "Active Customers", customersActive),
      card("lifetimeRevenue", "Lifetime Revenue", num(revAll._sum.grandTotal), "currency"),
      card("ordersToProcess", "Orders To Process", actionNeeded),
      card("activeProducts", "Active Products", productsActive),
      card("activeVariants", "Active Variants", variantsActive),
      card("lowStock", "Low Stock Items", lowStock),
      card("outOfStock", "Out Of Stock", outOfStock),
      card("unreadMessages", "New Messages", unreadMessages),
      card("pendingReviews", "Reviews Awaiting Approval", pendingReviews),
    ];

    return NextResponse.json({
      data: {
        range: { days, from: rangeStart, to: new Date() },
        generatedAt: new Date(),
        currency: "RWF",
        cards,
        charts: {
          revenueDaily, // [{ label: "2026-10-18", revenue, orders }]
          revenueMonthly, // last 12 months [{ label: "2026-10", revenue, orders }]
          customersDaily, // [{ label, customers }]
          topProducts: topProducts.map((p, i) => ({
            rank: i + 1,
            product: p.productName,
            sqmSold: num(p._sum.quantity), // was boxesSold
            revenue: num(p._sum.lineTotal),
          })),
        },
        pies: {
          ordersByStatus: toPie(
            ordersByStatus.map((r) => ({
              label: titleCase(r.status),
              value: r._count._all,
            })),
          ),
          ordersByFulfillment: toPie(
            ordersByFulfillment.map((r) => ({
              label: titleCase(r.fulfillment),
              value: r._count._all,
            })),
          ),
          paymentsByMethod: toPie(
            paymentsByMethod.map((r) => ({
              label: titleCase(r.method),
              value: num(r._sum.amount),
            })),
          ),
          paymentsByStatus: toPie(
            paymentsByStatus.map((r) => ({
              label: titleCase(r.status),
              value: r._count._all,
            })),
          ),
          revenueByCategory: toPie(
            [...categoryRevenue].map(([label, value]) => ({ label, value })),
          ),
          productsByCategory: toPie(
            productsByCategory.map((r) => ({
              label: r.categoryLabel,
              value: r._count._all,
            })),
          ),
          stockHealth: toPie([
            { label: "In stock", value: inStock },
            { label: "Low stock", value: lowStock },
            { label: "Out of stock", value: outOfStock },
          ]),
        },
        tables: {
          recentOrders: recentOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customer: o.user ? fullName(o.user) : (o.guestEmail ?? "Guest"),
            email: o.user?.email ?? o.guestEmail,
            status: o.status,
            paymentStatus: o.paymentStatus,
            fulfillment: o.fulfillment,
            items: o._count.items,
            total: num(o.grandTotal),
            currency: o.currency,
            placedAt: o.placedAt,
          })),
          topProducts: topProducts.map((p, i) => ({
            rank: i + 1,
            product: p.productName,
            boxesSold: num(p._sum.quantity),
            revenue: num(p._sum.lineTotal),
          })),
          lowStock: lowStockTable,
          recentCustomers: recentCustomers.map((u) => ({
            id: u.id,
            name: fullName(u),
            email: u.email,
            phone: u.phoneNumber,
            joinedAt: u.createdAt,
            lastLogin: u.lastLogin,
          })),
          recentPayments: recentPayments.map((p) => ({
            id: p.id,
            orderNumber: p.order.orderNumber,
            method: p.method,
            status: p.status,
            provider: p.provider,
            amount: num(p.amount),
            currency: p.currency,
            createdAt: p.createdAt,
          })),
          recentMessages: recentMessages.map((m) => ({
            id: m.id,
            name: `${m.firstName} ${m.lastName}`,
            email: m.email,
            projectType: m.projectType,
            status: m.status,
            createdAt: m.createdAt,
          })),
          pendingReviews: pendingReviewList.map((r) => ({
            id: r.id,
            product: r.product.name,
            customer: fullName(r.user),
            rating: r.rating,
            title: r.title,
            createdAt: r.createdAt,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json({ error: "Failed to fetch admin analytics" }, { status: 500 });
  }
});