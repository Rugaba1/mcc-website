import type { Prisma } from "@/lib/generated/prisma/client";

export const METHODS = [
  "MTN_MOMO",
  "AIRTEL_MONEY",
  "CARD",
  "BANK_TRANSFER",
  "CASH_ON_DELIVERY",
] as const;

const CAPTURED = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"];
const n = (v: unknown) => Number(v ?? 0);
const r2 = (v: number) => Math.round(v * 100) / 100;

type Pay = {
  amount: unknown;
  refundedAmount: unknown;
  status: string;
  paidAt?: Date | null;
};

/** Money actually received, money given back, and what is still owed. */
export function totalsOf(payments: Pay[], grandTotal: number) {
  const captured = r2(
    payments
      .filter((p) => CAPTURED.includes(p.status))
      .reduce((s, p) => s + n(p.amount), 0),
  );
  const refunded = r2(payments.reduce((s, p) => s + n(p.refundedAmount), 0));
  const net = r2(captured - refunded);
  return {
    captured,
    refunded,
    net,
    balanceDue: Math.max(0, r2(grandTotal - net)),
  };
}

/**
 * Recomputes order.paymentStatus from its payments and moves the order status when it
 * should follow (PENDING → PAID when fully paid, → REFUNDED when fully refunded).
 * Call inside the same transaction as the payment change.
 */
export async function syncOrderPayment(
  tx: Prisma.TransactionClient,
  orderId: number,
  actorId?: number | null,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      grandTotal: true,
      status: true,
      paidAt: true,
      payments: {
        select: { amount: true, refundedAmount: true, status: true, paidAt: true },
      },
    },
  });
  if (!order) return null;

  const grand = n(order.grandTotal);
  const t = totalsOf(order.payments, grand);

  let paymentStatus:
    | "PENDING"
    | "AUTHORIZED"
    | "PAID"
    | "FAILED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED";
  if (t.captured > 0) {
    if (t.refunded >= t.captured - 0.005) paymentStatus = "REFUNDED";
    else if (t.refunded > 0) paymentStatus = "PARTIALLY_REFUNDED";
    else paymentStatus = t.net >= grand - 0.005 ? "PAID" : "PENDING"; // part-paid stays PENDING until the balance is covered
  } else if (order.payments.some((p) => p.status === "AUTHORIZED"))
    paymentStatus = "AUTHORIZED";
  else if (
    order.payments.length > 0 &&
    order.payments.every((p) => p.status === "FAILED")
  )
    paymentStatus = "FAILED";
  else paymentStatus = "PENDING";

  const data: Prisma.OrderUpdateInput = { paymentStatus };
  let history: {
    status: "PENDING" | "PAID" | "REFUNDED";
    note: string;
  } | null = null;

  if (paymentStatus === "PAID") {
    const receipts = order.payments
      .filter((payment) => CAPTURED.includes(payment.status) && payment.paidAt)
      .sort((a, b) => a.paidAt!.getTime() - b.paidAt!.getTime());
    let received = 0;
    const completion = receipts.find((payment) => {
      received += n(payment.amount);
      return received >= grand - 0.005;
    })?.paidAt;
    data.paidAt = completion ?? order.paidAt ?? new Date();
    if (order.status === "PENDING") {
      data.status = "PAID";
      history = { status: "PAID", note: "Payment received in full" };
    }
  } else if (paymentStatus === "REFUNDED") {
    if (order.status !== "REFUNDED" && order.status !== "CANCELLED") {
      data.status = "REFUNDED";
      history = { status: "REFUNDED", note: "Order fully refunded" };
    }
  }

  await tx.order.update({ where: { id: orderId }, data });
  if (history)
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: history.status,
        note: history.note,
        changedById: actorId ?? null,
      },
    });

  return { paymentStatus, ...t, grandTotal: grand };
}
