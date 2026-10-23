import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";
import { syncOrderPayment } from "@/lib/payments/sync";
import { sendPaymentStatusEmail } from "@/lib/email";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  amount: z.number().positive().max(1e9),
  reason: z.string().trim().min(3, "Give a reason for the refund").max(255),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  const { claims, error } = await requireStaff(req);
  if (error) return error;
  const id = Number((await ctx.params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { amount, reason } = schema.parse(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.findUnique({
        where: { id },
        select: {
          status: true,
          amount: true,
          refundedAmount: true,
          orderId: true,
          order: {
            select: {
              orderNumber: true,
              currency: true,
              guestEmail: true,
              shipFullName: true,
              user: { select: { email: true, firstName: true } },
            },
          },
        },
      });
      if (!p) return { code: 404 } as const;
      if (p.status !== "PAID" && p.status !== "PARTIALLY_REFUNDED")
        return { code: 409 } as const;

      const refundable =
        Math.round((Number(p.amount) - Number(p.refundedAmount)) * 100) / 100;
      if (amount > refundable + 0.005)
        return { code: 400, refundable } as const;

      const refunded =
        Math.round((Number(p.refundedAmount) + amount) * 100) / 100;
      await tx.payment.update({
        where: { id },
        data: {
          refundedAmount: refunded,
          refundedAt: new Date(),
          refundReason: reason,
          status:
            refunded >= Number(p.amount) - 0.005
              ? "REFUNDED"
              : "PARTIALLY_REFUNDED",
          recordedById: claims.userId,
        },
      });
      const sync = await syncOrderPayment(tx, p.orderId, claims.userId);
      return {
        code: 200,
        sync,
        notification: {
          to: p.order.user?.email ?? p.order.guestEmail,
          firstName:
            p.order.user?.firstName ??
            p.order.shipFullName?.split(/\s+/)[0] ??
            "Customer",
          orderNumber: p.order.orderNumber,
          status: refunded >= Number(p.amount) - 0.005 ? "REFUNDED" : "PARTIALLY_REFUNDED",
          amount: String(amount),
          currency: p.order.currency,
        },
      } as const;
    });

    if (result.code === 404)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (result.code === 409)
      return NextResponse.json(
        { error: "Only paid payments can be refunded" },
        { status: 409 },
      );
    if (result.code === 400)
      return NextResponse.json(
        {
          error: `You can refund at most ${result.refundable} on this payment`,
        },
        { status: 400 },
      );
    if (result.notification.to) {
      await sendPaymentStatusEmail({
        ...result.notification,
        to: result.notification.to,
      });
    }
    return NextResponse.json({
      ok: true,
      orderPaymentStatus: result.sync?.paymentStatus,
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    console.error("POST /api/payments/[id]/refund:", e);
    return NextResponse.json(
      { error: "Failed to record refund" },
      { status: 500 },
    );
  }
}
