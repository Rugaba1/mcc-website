import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { syncOrderPayment, totalsOf } from "@/lib/payments/sync";
import { blankToNull } from "@/lib/variant";
import { sendAdminNotificationEmail } from "@/lib/email";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const schema = z
  .object({
    method: z.enum([
      "MTN_MOMO",
      "AIRTEL_MONEY",
      "BANK_TRANSFER",
      "CASH_ON_DELIVERY",
    ]),
    amount: z.number().positive().max(1e9).optional(),
    payerPhone: z.string().trim().max(20).nullable().optional(),
    providerRef: z.string().trim().max(150).nullable().optional(),
    note: z.string().trim().max(255).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    const mobile = v.method === "MTN_MOMO" || v.method === "AIRTEL_MONEY";
    if (mobile && (v.payerPhone ?? "").replace(/\D/g, "").length < 9)
      ctx.addIssue({
        code: "custom",
        path: ["payerPhone"],
        message: "Enter the phone number you paid from",
      });
    if (v.method !== "CASH_ON_DELIVERY" && (v.providerRef ?? "").length < 4)
      ctx.addIssue({
        code: "custom",
        path: ["providerRef"],
        message: "Enter the transaction ID or reference",
      });
  });

// POST /api/me/orders/[id]/payments — the customer says "I paid", staff then verify it
export async function POST(req: NextRequest, ctx: Ctx) {
  const { claims, error } = await requireUser(req);
  if (error) return error;
  const orderId = Number((await ctx.params).id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const body = blankToNull(schema.parse(await req.json()));

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId: claims.userId },
        select: {
          grandTotal: true,
          currency: true,
          status: true,
          orderNumber: true,
          guestEmail: true,
          shipFullName: true,
          user: { select: { email: true, firstName: true, lastName: true } },
          payments: {
            select: { amount: true, refundedAmount: true, status: true },
          },
        },
      });
      if (!order) return { code: 404 } as const;
      if (order.status === "CANCELLED" || order.status === "REFUNDED")
        return { code: 409, msg: "This order is closed" } as const;
      if (
        order.payments.some(
          (p) => p.status === "PENDING" || p.status === "AUTHORIZED",
        )
      )
        return {
          code: 409,
          msg: "You already have a payment waiting for confirmation. Edit or withdraw it first.",
        } as const;

      const { balanceDue } = totalsOf(order.payments, Number(order.grandTotal));
      if (balanceDue <= 0)
        return { code: 409, msg: "Nothing left to pay on this order" } as const;

      const amount = body.amount ?? balanceDue;
      if (amount > balanceDue + 0.005)
        return {
          code: 400,
          msg: `The most you can pay is ${balanceDue}`,
        } as const;

      const payment = await tx.payment.create({
        data: {
          orderId,
          method: body.method,
          amount,
          currency: order.currency,
          provider: "manual",
          status: "PENDING",
          providerRef: body.providerRef,
          payerPhone: body.payerPhone,
          note: body.note,
        },
      });
      await syncOrderPayment(tx, orderId, claims.userId);
      return {
        code: 201,
        id: payment.id,
        notification: {
          orderNumber: order.orderNumber,
          name:
            [order.user?.firstName, order.user?.lastName]
              .filter(Boolean)
              .join(" ") || order.shipFullName || "Customer",
          email: order.user?.email ?? order.guestEmail,
        },
      } as const;
    });

    if (result.code === 404)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (result.code === 201) {
      if (result.notification.email) {
        await sendAdminNotificationEmail({
          name: result.notification.name,
          email: result.notification.email,
          subject: `Payment submitted for order ${result.notification.orderNumber}`,
          message: `A customer submitted payment details for order ${result.notification.orderNumber}. Please review the payment in the admin dashboard.`,
        });
      }
      return NextResponse.json({ id: result.id }, { status: 201 });
    }
    return NextResponse.json({ error: result.msg }, { status: result.code });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    if ((e as { code?: string })?.code === "P2002")
      return NextResponse.json(
        { error: "That transaction ID has already been used" },
        { status: 409 },
      );
    console.error("POST /api/me/orders/[id]/payments:", e);
    return NextResponse.json(
      { error: "Failed to submit payment" },
      { status: 500 },
    );
  }
}
