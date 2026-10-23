import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";
import { syncOrderPayment } from "@/lib/payments/sync";
import { blankToNull } from "@/lib/variant";
import { sendPaymentStatusEmail } from "@/lib/email";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const text = (max: number) => z.string().trim().max(max).nullable().optional();
const fileUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (u) => u === "" || u.startsWith("/uploads/") || u.startsWith("https://"),
    "Must be an uploaded file or an https URL",
  )
  .nullable()
  .optional();

const schema = z.object({
  status: z.enum(["PENDING", "AUTHORIZED", "PAID", "FAILED"]).optional(), // refunds go through /refund
  providerRef: text(150),
  payerPhone: text(20),
  provider: text(50),
  failureReason: text(255),
  note: text(255),
  proofUrl: fileUrl,
  paidAt: z.string().datetime().nullable().optional(),
});

// PUT /api/payments/[id] — confirm a manual payment, mark it failed, fix the reference or notes
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { claims, error } = await requireStaff(req);
  if (error) return error;
  const id = Number((await ctx.params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { paidAt, ...rest } = blankToNull(schema.parse(await req.json()));

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { id },
        select: {
          status: true,
          orderId: true,
          amount: true,
          refundedAmount: true,
          paidAt: true,
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
      if (!current) return { code: 404 } as const;
      if (
        Number(current.refundedAmount) > 0 &&
        rest.status &&
        rest.status !== current.status
      )
        return { code: 409 } as const;

      const data: Prisma.PaymentUncheckedUpdateInput = {
        ...rest,
        recordedById: claims.userId,
      };
      if (rest.status === "PAID") {
        data.paidAt = paidAt
          ? new Date(paidAt)
          : (current.paidAt ?? new Date());
        data.failureReason = null;
      } else if (rest.status) {
        data.paidAt = null;
        if (rest.status === "FAILED" && !rest.failureReason)
          data.failureReason = "Marked as failed by staff";
      }

      const payment = await tx.payment.update({ where: { id }, data });
      const sync = await syncOrderPayment(tx, current.orderId, claims.userId);
      return {
        code: 200,
        payment,
        sync,
        notification:
          rest.status &&
          rest.status !== current.status &&
          (rest.status === "PAID" || rest.status === "FAILED")
            ? {
                to: current.order.user?.email ?? current.order.guestEmail,
                firstName:
                  current.order.user?.firstName ??
                  current.order.shipFullName?.split(/\s+/)[0] ??
                  "Customer",
                orderNumber: current.order.orderNumber,
                status: rest.status,
                amount: current.amount.toString(),
                currency: current.order.currency,
              }
            : null,
      } as const;
    });

    if (result.code === 404)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (result.code === 409)
      return NextResponse.json(
        {
          error:
            "This payment has refunds, so its status can’t be changed. You can still edit the note.",
        },
        { status: 409 },
      );
    if (result.notification?.to) {
      await sendPaymentStatusEmail({
        ...result.notification,
        to: result.notification.to,
      });
    }
    return NextResponse.json({
      id,
      status: result.payment.status,
      orderPaymentStatus: result.sync?.paymentStatus,
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    if ((e as { code?: string })?.code === "P2002")
      return NextResponse.json(
        { error: "That reference is already used by another payment" },
        { status: 409 },
      );
    console.error("PUT /api/payments/[id]:", e);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}
