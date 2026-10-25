import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { blankToNull } from "@/lib/variant";
import { METHODS, syncOrderPayment, totalsOf } from "@/lib/payments/sync";
import { issueInvoiceSafely } from "@/lib/invoices/invoice";
import { sendAdminNotificationEmail, sendPaymentStatusEmail } from "@/lib/email";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const text = (max: number) => z.string().trim().max(max).nullable().optional();
const schema = z.object({
  method: z.enum(METHODS),
  amount: z.number().positive().max(1e9),
  status: z.enum(["PAID", "PENDING"]).default("PAID"),
  providerRef: text(150), payerPhone: text(20), note: text(255),
  proofUrl: z.string().trim().max(2048)
    .refine((u) => u === "" || u.startsWith("/uploads/") || u.startsWith("https://"), "Must be an uploaded file or an https URL")
    .nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
});

// POST /api/orders/[id]/payments — staff record cash, MoMo, bank transfer… received outside the website
export const POST = withPermission(PERM.PAYMENTS_RECORD)(
  async (req: NextRequest, context) => {
  const orderId = Number((await context.params!).id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { paidAt, ...body } = blankToNull(schema.parse(await req.json()));

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          grandTotal: true,
          currency: true,
          status: true,
          orderNumber: true,
          guestEmail: true,
          shipFullName: true,
          user: { select: { email: true, firstName: true, lastName: true } },
          payments: { select: { amount: true, refundedAmount: true, status: true } },
        },
      });
      if (!order) return { code: 404 } as const;
      if (order.status === "CANCELLED" || order.status === "REFUNDED") return { code: 409 } as const;

      const { balanceDue } = totalsOf(order.payments, Number(order.grandTotal));
      if (body.status === "PAID" && body.amount > balanceDue + 0.005) return { code: 400, balanceDue } as const;

      const payment = await tx.payment.create({
        data: {
          ...body, orderId, currency: order.currency, provider: "manual", recordedById: context.user.id,
          paidAt: body.status === "PAID" ? (paidAt ? new Date(paidAt) : new Date()) : null,
        },
      });
      await tx.adminNotification.create({
        data: {
          type: "payment",
          requiredPermission: PERM.PAYMENTS_VIEW,
          title: body.status === "PAID" ? "Payment recorded" : "Payment submitted",
          message: `${order.orderNumber} · ${order.currency} ${body.amount}`,
          targetPath: "/admin/payments",
          entityId: payment.id,
        },
      });
      const sync = await syncOrderPayment(tx, orderId, context.user.id);
      return {
        code: 201,
        payment,
        sync,
        notification: {
          to: order.user?.email ?? order.guestEmail,
          firstName:
            order.user?.firstName ??
            order.shipFullName?.split(/\s+/)[0] ??
            "Customer",
          customerName:
            [order.user?.firstName, order.user?.lastName]
              .filter(Boolean)
              .join(" ") || order.shipFullName || "Customer",
          orderNumber: order.orderNumber,
          email: order.user?.email ?? order.guestEmail,
          amount: String(body.amount),
          currency: order.currency,
        },
      } as const;
    });

    if (result.code === 404) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (result.code === 409) return NextResponse.json({ error: "This order is cancelled or refunded" }, { status: 409 });
    if (result.code === 400) return NextResponse.json({ error: `That is more than the remaining balance of ${result.balanceDue}` }, { status: 400 });
    await issueInvoiceSafely(result.payment.orderId);
    if (result.payment.status === "PAID" && result.notification.to) {
      await sendPaymentStatusEmail({
        to: result.notification.to,
        firstName: result.notification.firstName,
        orderNumber: result.notification.orderNumber,
        status: "PAID",
        amount: result.notification.amount,
        currency: result.notification.currency,
      });
    }
    if (result.payment.status === "PENDING" && result.notification.email) {
      await sendAdminNotificationEmail({
        name: result.notification.customerName,
        email: result.notification.email,
        subject: `Payment submitted for order ${result.notification.orderNumber}`,
        message: `A customer submitted payment details for order ${result.notification.orderNumber}. Please review the payment in the admin dashboard.`,
      });
    }
    return NextResponse.json({ id: result.payment.id, orderPaymentStatus: result.sync?.paymentStatus }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    if ((e as { code?: string })?.code === "P2002") return NextResponse.json({ error: "That reference is already used by another payment" }, { status: 409 });
    console.error("POST /api/orders/[id]/payments:", e);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
});