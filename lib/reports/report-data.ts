import { prisma } from "@/lib/prisma";
import { round } from "@/lib/analytics/helpers";

export type ReportFormat = "csv" | "xlsx" | "pdf";

export type ReportTable = {
  title: string;
  description: string;
  columns: string[];
  rows: (string | number)[][];
  generatedAt: string;
};

const asNumber = (value: unknown) => Number(value ?? 0);

export class ReportValidationError extends Error {}

function parseDateRange(searchParams: URLSearchParams) {
  const fromValue = searchParams.get("from");
  const toValue = searchParams.get("to");
  if (!fromValue || !toValue || !/^\d{4}-\d{2}-\d{2}$/.test(fromValue) || !/^\d{4}-\d{2}-\d{2}$/.test(toValue)) {
    throw new ReportValidationError("Provide valid from and to dates in YYYY-MM-DD format.");
  }
  const from = new Date(`${fromValue}T00:00:00.000Z`);
  const to = new Date(`${toValue}T00:00:00.000Z`);
  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    from.toISOString().slice(0, 10) !== fromValue ||
    to.toISOString().slice(0, 10) !== toValue ||
    from > to
  ) {
    throw new ReportValidationError("The report date range is invalid.");
  }
  const days = (to.getTime() - from.getTime()) / 86_400_000 + 1;
  if (days > 366) throw new ReportValidationError("Report date ranges cannot exceed 366 days.");
  to.setUTCDate(to.getUTCDate() + 1);
  return { from: fromValue, to: toValue, start: from, end: to };
}

export async function buildFinancialReport(searchParams: URLSearchParams): Promise<ReportTable> {
  const range = parseDateRange(searchParams);
  const placedAt = { gte: range.start, lt: range.end };
  const paidAt = { gte: range.start, lt: range.end };
  const [orders, payments, openOrders] = await Promise.all([
    prisma.order.groupBy({
      by: ["currency", "status", "paymentStatus"],
      where: { placedAt },
      _count: { _all: true },
      _sum: {
        subtotal: true,
        discountTotal: true,
        shippingFee: true,
        taxTotal: true,
        grandTotal: true,
      },
    }),
    prisma.payment.groupBy({
      by: ["currency", "status"],
      where: { createdAt: paidAt },
      _count: { _all: true },
      _sum: { amount: true, refundedAmount: true },
    }),
    prisma.order.findMany({
      where: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        paymentStatus: { in: ["PENDING", "AUTHORIZED", "PARTIALLY_REFUNDED"] },
      },
      select: {
        currency: true,
        grandTotal: true,
        placedAt: true,
        payments: {
          where: { status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] } },
          select: { amount: true, refundedAmount: true },
        },
      },
    }),
  ]);

  const now = new Date();
  const receivables = new Map<string, {
    current: number;
    currentOrders: number;
    days31To60: number;
    days31To60Orders: number;
    days61To90: number;
    days61To90Orders: number;
    over90: number;
    over90Orders: number;
  }>();
  for (const order of openOrders) {
    const netPaid = order.payments.reduce(
      (sum, payment) =>
        sum + Math.max(0, asNumber(payment.amount) - asNumber(payment.refundedAmount)),
      0,
    );
    const balance = Math.max(0, asNumber(order.grandTotal) - netPaid);
    if (balance <= 0) continue;
    const bucket = receivables.get(order.currency) ?? {
      current: 0,
      currentOrders: 0,
      days31To60: 0,
      days31To60Orders: 0,
      days61To90: 0,
      days61To90Orders: 0,
      over90: 0,
      over90Orders: 0,
    };
    const daysOld = Math.max(0, Math.floor((now.getTime() - order.placedAt.getTime()) / 86_400_000));
    if (daysOld <= 30) {
      bucket.current += balance;
      bucket.currentOrders += 1;
    } else if (daysOld <= 60) {
      bucket.days31To60 += balance;
      bucket.days31To60Orders += 1;
    } else if (daysOld <= 90) {
      bucket.days61To90 += balance;
      bucket.days61To90Orders += 1;
    } else {
      bucket.over90 += balance;
      bucket.over90Orders += 1;
    }
    receivables.set(order.currency, bucket);
  }

  const rows: (string | number)[][] = [
    ...orders.map((order) => [
      "Order",
      order.currency,
      `${order.status} / ${order.paymentStatus}`,
      order._count._all,
      round(asNumber(order._sum.subtotal), 2),
      round(asNumber(order._sum.discountTotal), 2),
      round(asNumber(order._sum.shippingFee), 2),
      round(asNumber(order._sum.taxTotal), 2),
      round(asNumber(order._sum.grandTotal), 2),
    ]),
    ...payments.map((payment) => [
      "Payment",
      payment.currency,
      payment.status,
      payment._count._all,
      round(asNumber(payment._sum.amount), 2),
      round(asNumber(payment._sum.refundedAmount), 2),
      "",
      "",
      "",
    ]),
    ...[...receivables.entries()].flatMap(([currency, bucket]) =>
      [
        ["0-30 days", bucket.current, bucket.currentOrders],
        ["31-60 days", bucket.days31To60, bucket.days31To60Orders],
        ["61-90 days", bucket.days61To90, bucket.days61To90Orders],
        ["Over 90 days", bucket.over90, bucket.over90Orders],
      ].map(([ageBand, balance, count]) => [
        "Receivable",
        currency,
        ageBand,
        count,
        "",
        "",
        "",
        "",
        round(Number(balance), 2),
      ]),
    ),
  ];

  return {
    title: "Financial Activity and Receivables",
    description: [
      `Order activity from ${range.from} to ${range.to}.`,
      "Receivables are current open-order balances grouped by days since order placement; due dates are not recorded.",
      "This is not a complete profit-and-loss statement: product costs and operating expenses are not recorded in the system.",
    ].join(" "),
    columns: [
      "Record type",
      "Currency",
      "Status / age band",
      "Count",
      "Subtotal / amount",
      "Discount / refunds",
      "Shipping",
      "Tax",
      "Order total / balance",
    ],
    rows,
    generatedAt: now.toISOString(),
  };
}

export async function buildInventoryReport(): Promise<ReportTable> {
  const variants = await prisma.productVariant.findMany({
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
    select: {
      id: true,
      sku: true,
      size: true,
      finish: true,
      product: { select: { name: true } },
      inventory: {
        select: { onHandSqm: true, reservedSqm: true, reorderLevel: true },
      },
    },
  });

  return {
    title: "Inventory Position",
    description: "Current operational stock snapshot in square metres. No item-cost data is stored, so this report does not include inventory valuation.",
    columns: ["Variant ID", "Product", "SKU", "Size", "Finish", "On hand (m²)", "Reserved (m²)", "Available (m²)", "Reorder level (m²)", "Stock status"],
    rows: variants.map((variant) => {
      const onHand = asNumber(variant.inventory?.onHandSqm);
      const reserved = asNumber(variant.inventory?.reservedSqm);
      const available = round(onHand - reserved, 2);
      const reorderLevel = asNumber(variant.inventory?.reorderLevel);
      const status = available <= 0 ? "OUT_OF_STOCK" : available <= reorderLevel ? "LOW" : "IN_STOCK";
      return [
        variant.id,
        variant.product.name,
        variant.sku,
        variant.size,
        variant.finish ?? "",
        round(onHand, 2),
        round(reserved, 2),
        available,
        round(reorderLevel, 2),
        status,
      ];
    }),
    generatedAt: new Date().toISOString(),
  };
}
