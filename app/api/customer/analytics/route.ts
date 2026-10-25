import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import {
  buildSeries,
  card,
  daysAgo,
  monthKey,
  monthKeys,
  monthsAgoStart,
  num,
  parseDays,
  round,
  titleCase,
  toPie,
} from "@/lib/analytics/helpers";
import { withAuth } from "@/lib/middleware/withAuth";

const REVENUE_ORDER: Prisma.OrderWhereInput = {
  paymentStatus: "PAID",
  status: { notIn: ["CANCELLED", "REFUNDED"] },
};
export const GET = withAuth(async (request, { user }) => {
  try {
    const baseCurrency = await prisma.currency.findFirst({
      where: { isBase: true, enabled: true },
      select: { code: true },
    });
    if (!baseCurrency) {
      return NextResponse.json(
        { error: "Store base currency is not configured" },
        { status: 503 },
      );
    }
    const userId = user.id;
    const days = parseDays(request.nextUrl.searchParams);
    const rangeStart = daysAgo(days - 1);
    const prevStart = daysAgo(days * 2 - 1);
    const monthsStart = monthsAgoStart(11);

    const mine: Prisma.OrderWhereInput = { userId };
    const inRange = { gte: rangeStart };
    const inPrev = { gte: prevStart, lt: rangeStart };

    const [
      spentAll,
      spentCur,
      spentPrev,
      ordersTotal,
      ordersCur,
      ordersPrev,
      activeOrdersCount,
      deliveredCount,
      wishlistCount,
      designsCount,
      reviewsCount,
      addressesCount,
      cart,
      seriesOrders,
      ordersByStatus,
      ordersByFulfillment,
      paymentsByMethod,
      boughtItems,
      activeOrders,
      recentOrders,
      recentPayments,
      wishlist,
      designs,
      recentReviews,
    ] = await Promise.all([
      // ── cards ──
      prisma.order.aggregate({
        where: { ...mine, ...REVENUE_ORDER },
        _sum: { grandTotal: true },
        _avg: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: { ...mine, ...REVENUE_ORDER, placedAt: inRange },
        _sum: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: { ...mine, ...REVENUE_ORDER, placedAt: inPrev },
        _sum: { grandTotal: true },
      }),
      prisma.order.count({ where: mine }),
      prisma.order.count({ where: { ...mine, placedAt: inRange } }),
      prisma.order.count({ where: { ...mine, placedAt: inPrev } }),
      prisma.order.count({
        where: {
          ...mine,
          status: { in: ["PENDING", "PAID", "PROCESSING", "SHIPPED"] },
        },
      }),
      prisma.order.count({ where: { ...mine, status: "DELIVERED" } }),
      prisma.wishlistItem.count({ where: { userId } }),
      prisma.visualizerDesign.count({ where: { userId } }),
      prisma.review.count({ where: { userId } }),
      prisma.address.count({ where: { userId } }),

      // ── cart ──
      prisma.cart.findUnique({
        where: { userId },
        select: {
          coupon: { select: { code: true, type: true, value: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              saleType: true,
              variant: {
                select: {
                  sku: true,
                  size: true,
                  finish: true,
                  pricePerSqm: true,
                  containerPricePerSqm: true,
                  sqmPerContainer: true,
                  image: true,
                  product: { select: { name: true, image: true } },
                },
              },
            },
          },
        },
      }),

      // ── time series ──
      prisma.order.findMany({
        where: { ...mine, placedAt: { gte: monthsStart } },
        select: {
          placedAt: true,
          grandTotal: true,
          status: true,
          paymentStatus: true,
        },
      }),

      // ── pies ──
      prisma.order.groupBy({
        by: ["status"],
        where: mine,
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["fulfillment"],
        where: mine,
        _count: { _all: true },
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: { status: "PAID", order: { userId } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.orderItem.findMany({
        where: { order: { ...mine, ...REVENUE_ORDER } },
        select: {
          lineTotal: true,
          variant: { select: { product: { select: { categoryLabel: true } } } },
        },
      }),

      // ── tables ──
      prisma.order.findMany({
        where: {
          ...mine,
          status: { in: ["PENDING", "PAID", "PROCESSING", "SHIPPED"] },
        },
        take: 5,
        orderBy: { placedAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillment: true,
          grandTotal: true,
          placedAt: true,
          deliveryZone: { select: { estimatedDays: true } },
          history: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { status: true, note: true, createdAt: true },
          },
        },
      }),
      prisma.order.findMany({
        where: mine,
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
          _count: { select: { items: true } },
        },
      }),
      prisma.payment.findMany({
        where: { order: { userId } },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          currency: true,
          createdAt: true,
          order: { select: { orderNumber: true } },
        },
      }),
      prisma.wishlistItem.findMany({
        where: { userId },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              categoryLabel: true,
            },
          },
        },
      }),
      prisma.visualizerDesign.findMany({
        where: { userId },
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          previewImage: true,
          shareToken: true,
          updatedAt: true,
          scene: { select: { name: true, roomType: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.review.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          title: true,
          approved: true,
          createdAt: true,
          product: { select: { name: true } },
        },
      }),
    ]);

    // ── charts ──
    const spendMonthly = buildSeries(
      monthKeys(12),
      ["spent", "orders"],
      seriesOrders,
      (o) => monthKey(o.placedAt),
      (o) => ({
        spent:
          o.paymentStatus === "PAID" &&
          o.status !== "CANCELLED" &&
          o.status !== "REFUNDED"
            ? num(o.grandTotal)
            : 0,
        orders: o.status === "CANCELLED" ? 0 : 1,
      }),
    );

    const categorySpend = new Map<string, number>();
    for (const item of boughtItems) {
      const label = item.variant?.product.categoryLabel ?? "Other";
      categorySpend.set(
        label,
        (categorySpend.get(label) ?? 0) + num(item.lineTotal),
      );
    }

    // ── cart ──
    const cartItems = (cart?.items ?? []).map((i) => {
      const qty = num(i.quantity);
      const isContainer = i.saleType === "CONTAINER";
      const perContainer = num(i.variant.sqmPerContainer);
      const areaSqm = isContainer ? qty * perContainer : qty;
      const unitPrice = isContainer
        ? num(i.variant.containerPricePerSqm)
        : num(i.variant.pricePerSqm); // base-currency price per m²
      return {
        id: i.id,
        product: i.variant.product.name,
        image: i.variant.image ?? i.variant.product.image,
        sku: i.variant.sku,
        size: i.variant.size,
        finish: i.variant.finish,
        saleType: i.saleType,
        quantity: qty, // m², or containers when saleType is CONTAINER
        areaSqm: round(areaSqm, 2),
        unitPrice, // per m²
        lineTotal: round(unitPrice * areaSqm),
      };
    });
    const cartSubtotal = round(cartItems.reduce((s, i) => s + i.lineTotal, 0));
    const cartSqm = round(
      cartItems.reduce((s, i) => s + i.areaSqm, 0),
      2,
    );
    const cartBoxes = cartItems.reduce((s, i) => s + i.quantity, 0);

    const spent = num(spentCur._sum.grandTotal);

    const cards = [
      card(
        "totalSpent",
        "Total Spent",
        num(spentAll._sum.grandTotal),
        "currency",
      ),
      card(
        "periodSpent",
        "Spent (period)",
        spent,
        "currency",
        num(spentPrev._sum.grandTotal),
      ),
      card("totalOrders", "Total Orders", ordersTotal),
      card("periodOrders", "Orders (period)", ordersCur, "number", ordersPrev),
      card("activeOrders", "Orders In Progress", activeOrdersCount),
      card("deliveredOrders", "Delivered", deliveredCount),
      card(
        "avgOrderValue",
        "Avg. Order Value",
        num(spentAll._avg.grandTotal),
        "currency",
      ),
      card("cartBoxes", "Boxes In Cart", cartBoxes),
      card("cartValue", "Cart Value", cartSubtotal, "currency"),
      card("wishlist", "Wishlist", wishlistCount),
      card("designs", "Saved Designs", designsCount),
      card("reviews", "My Reviews", reviewsCount),
      card("addresses", "Saved Addresses", addressesCount),
      card("cartSqm", "Area In Cart (m²)", cartSqm),
    ];

    return NextResponse.json({
      data: {
        range: { days, from: rangeStart, to: new Date() },
        generatedAt: new Date(),
        currency: baseCurrency.code,
        customer: {
          id: user.id,
          name: [user.firstName, user.lastName].filter(Boolean).join(" "),
          email: user.email,
        },
        cards,
        charts: {
          spendMonthly, // last 12 months [{ label: "2026-10", spent, orders }]
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
          spendByPaymentMethod: toPie(
            paymentsByMethod.map((r) => ({
              label: titleCase(r.method),
              value: num(r._sum.amount),
            })),
          ),
          spendByCategory: toPie(
            [...categorySpend].map(([label, value]) => ({ label, value })),
          ),
        },
        tables: {
          activeOrders: activeOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            paymentStatus: o.paymentStatus,
            fulfillment: o.fulfillment,
            total: num(o.grandTotal),
            placedAt: o.placedAt,
            estimatedDays: o.deliveryZone?.estimatedDays ?? null,
            lastUpdate: o.history[0] ?? null,
          })),
          recentOrders: recentOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            paymentStatus: o.paymentStatus,
            fulfillment: o.fulfillment,
            items: o._count.items,
            total: num(o.grandTotal),
            currency: o.currency,
            placedAt: o.placedAt,
          })),
          recentPayments: recentPayments.map((p) => ({
            id: p.id,
            orderNumber: p.order.orderNumber,
            method: p.method,
            status: p.status,
            amount: num(p.amount),
            currency: p.currency,
            createdAt: p.createdAt,
          })),
          cart: {
            items: cartItems,
            subtotal: cartSubtotal,
            coupon: cart?.coupon
              ? {
                  code: cart.coupon.code,
                  type: cart.coupon.type,
                  value: num(cart.coupon.value),
                }
              : null,
          },
          wishlist: wishlist.map((w) => ({
            id: w.id,
            productId: w.product.id,
            name: w.product.name,
            slug: w.product.slug,
            image: w.product.image,
            category: w.product.categoryLabel,
            addedAt: w.createdAt,
          })),
          designs: designs.map((d) => ({
            id: d.id,
            name: d.name ?? "Untitled design",
            previewImage: d.previewImage,
            shareToken: d.shareToken,
            scene: d.scene?.name ?? null,
            roomType: d.scene?.roomType ?? null,
            surfaces: d._count.items,
            updatedAt: d.updatedAt,
          })),
          recentReviews: recentReviews.map((r) => ({
            id: r.id,
            product: r.product.name,
            rating: r.rating,
            title: r.title,
            approved: r.approved,
            createdAt: r.createdAt,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching customer analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer analytics" },
      { status: 500 },
    );
  }
});
