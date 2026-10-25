import { Prisma } from "@/lib/generated/prisma";
import type { InvoiceKind, OrderStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma"; // <- adjust to your prisma singleton
import { renderInvoicePdf } from "./render";
import { deleteInvoicePdf, readInvoicePdf, saveInvoicePdf } from "./storage";
import type { InvoiceData } from "./template";
import { invoicePath, signedInvoiceUrl } from "./url";

export { invoicePath, signedInvoiceUrl, verifyInvoiceSignature } from "./url";
export { readInvoicePdf } from "./storage";

/** Order status -> document that should exist. CANCELLED gets none. */
export function kindForStatus(status: OrderStatus): InvoiceKind | null {
  switch (status) {
    case "PENDING":
      return "PROFORMA";
    case "PAID":
    case "PROCESSING":
    case "SHIPPED":
    case "DELIVERED":
      return "INVOICE";
    case "REFUNDED":
      return "CREDIT_NOTE";
    default:
      return null;
  }
}

const PREFIX: Record<InvoiceKind, string> = {
  PROFORMA: "PF",
  INVOICE: "INV",
  CREDIT_NOTE: "CN",
};
const METHOD_LABEL: Record<string, string> = {
  MTN_MOMO: "MTN MoMo",
  AIRTEL_MONEY: "Airtel Money",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  CASH_ON_DELIVERY: "Cash on delivery",
};

const num = (v: Prisma.Decimal | number | null | undefined) => Number(v ?? 0);

async function loadInvoiceData(
  orderId: number,
  kind: InvoiceKind,
): Promise<InvoiceData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      user: true,
      coupon: true,
      invoices: { where: { kind: "INVOICE" } },
    },
  });
  if (!order) return null;
  const currency = await prisma.currency.findUnique({
    where: { code: order.currency },
    select: { decimalDigits: true },
  });

  const paid = order.payments.filter((p) => p.status === "PAID");
  const amountPaid = paid.reduce((s, p) => s + num(p.amount), 0);
  const total = num(order.grandTotal);
  const methods = [
    ...new Set(
      (paid.length ? paid : order.payments).map(
        (p) => METHOD_LABEL[p.method] ?? p.method,
      ),
    ),
  ];

  const billName =
    [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
    order.shipFullName ||
    "Guest customer";

  return {
    kind,
    number: `${PREFIX[kind]}-${order.orderNumber.replace(/^[A-Za-z]+-/, "")}`,
    orderNumber: order.orderNumber,
    relatedInvoiceNumber:
      kind === "CREDIT_NOTE" ? order.invoices[0]?.number : undefined,
    issuedAt: new Date(),
    placedAt: order.placedAt,
    currency: order.currency,
    currencyDigits: currency?.decimalDigits,
    billTo: {
      name: billName,
      email: order.user?.email ?? order.guestEmail,
      phone: order.user?.phoneNumber ?? order.guestPhone ?? order.shipPhone,
      tin: order.tin,
    },
    fulfillment: order.fulfillment,
    shipTo: {
      name: order.shipFullName,
      phone: order.shipPhone,
      lines: [
        order.shipStreet,
        order.shipSector,
        order.shipDistrict,
        order.shipProvince,
        "Rwanda",
      ].filter(Boolean) as string[],
    },
    items: order.items.map((i) => ({
      name: i.productName,
      sku: i.sku,
      size: i.size,
      finish: i.finish,
      shade: i.shadeCode,
      saleType: i.saleType,
      sqm: num(i.quantity),
      containers: i.containers ?? 0,
      unitPrice: num(i.unitPrice),
      lineTotal: num(i.lineTotal),
    })),
    subtotal: num(order.subtotal),
    discount: num(order.discountTotal),
    couponCode: order.coupon?.code,
    shipping: num(order.shippingFee),
    tax: num(order.taxTotal),
    total,
    amountPaid,
    balance: Math.max(total - amountPaid, 0),
    paymentMethods: methods,
    customerNote: order.customerNote,
  };
}

export interface InvoiceResult {
  id: number;
  kind: InvoiceKind;
  number: string;
  /** Permanent URL, requires login (owner / orders.view) or a signed link. */
  url: string;
  /** Expiring public link, safe to email to the customer. */
  signedUrl: string;
  created: boolean;
}

const toResult = (
  inv: { id: number; kind: InvoiceKind; number: string },
  created: boolean,
): InvoiceResult => ({
  id: inv.id,
  kind: inv.kind,
  number: inv.number,
  url: invoicePath(inv.number),
  signedUrl: signedInvoiceUrl(inv.number),
  created,
});

/**
 * Ensures the right invoice document exists for the order's CURRENT status.
 * Idempotent: calling it twice returns the same PDF. Safe to call from webhooks.
 * Returns null when the status has no document (CANCELLED) or a credit note
 * is requested for an order that was never invoiced.
 */
export async function syncOrderInvoice(
  orderId: number,
): Promise<InvoiceResult | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!order) return null;

  const kind = kindForStatus(order.status);
  if (!kind) return null;

  const existing = await prisma.invoice.findUnique({
    where: { orderId_kind: { orderId, kind } },
  });
  if (existing) return toResult(existing, false);

  if (kind === "CREDIT_NOTE") {
    const original = await prisma.invoice.findUnique({
      where: { orderId_kind: { orderId, kind: "INVOICE" } },
    });
    if (!original) return null;
  }

  const data = await loadInvoiceData(orderId, kind);
  if (!data) return null;

  const pdf = await renderInvoicePdf(data);
  const file = await saveInvoicePdf(pdf);

  try {
    const created = await prisma.invoice.create({
      data: {
        orderId,
        kind,
        number: data.number,
        fileKey: file.fileKey,
        sha256: file.sha256,
        sizeBytes: file.sizeBytes,
        total: data.total,
        currency: data.currency,
      },
    });
    return toResult(created, true);
  } catch (e) {
    await deleteInvoicePdf(file.fileKey).catch(() => {});
    // lost a race with a parallel call, return the winner
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const winner = await prisma.invoice.findUnique({
        where: { orderId_kind: { orderId, kind } },
      });
      if (winner) return toResult(winner, false);
    }
    throw e;
  }
}

/** All documents for an order, for the order page / admin UI. */
export async function listOrderInvoices(orderId: number) {
  const rows = await prisma.invoice.findMany({
    where: { orderId },
    orderBy: { issuedAt: "asc" },
  });
  return rows.map((r) => toResult(r, false));
}

/**
 * Call inside your status-change code AFTER the DB update has committed:
 *
 *   await prisma.order.update({ where: { id }, data: { status: "PAID", paymentStatus: "PAID", paidAt: new Date() } });
 *   await issueInvoiceSafely(id);
 *
 * A PDF failure must never roll back or block a payment.
 */
export async function issueInvoiceSafely(
  orderId: number,
): Promise<InvoiceResult | null> {
  try {
    return await syncOrderInvoice(orderId);
  } catch (error) {
    console.error(`[invoice] failed for order ${orderId}`, error);
    return null;
  }
}

export async function readInvoiceFile(fileKey: string) {
  return readInvoicePdf(fileKey);
}
