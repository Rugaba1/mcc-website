import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";
import { blankToNull } from "@/lib/variant";
import { METHODS, syncOrderPayment, totalsOf } from "@/lib/payments/sync";
import { issueInvoiceSafely } from "@/lib/invoices/invoice";

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
export async function POST(req: NextRequest, ctx: Ctx) {
  const { claims, error } = await requireStaff(req);
  if (error) return error;
  const orderId = Number((await ctx.params).id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { paidAt, ...body } = blankToNull(schema.parse(await req.json()));

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { grandTotal: true, currency: true, status: true, payments: { select: { amount: true, refundedAmount: true, status: true } } },
      });
      if (!order) return { code: 404 } as const;
      if (order.status === "CANCELLED" || order.status === "REFUNDED") return { code: 409 } as const;

      const { balanceDue } = totalsOf(order.payments, Number(order.grandTotal));
      if (body.status === "PAID" && body.amount > balanceDue + 0.005) return { code: 400, balanceDue } as const;

      const payment = await tx.payment.create({
        data: {
          ...body, orderId, currency: order.currency, provider: "manual", recordedById: claims.userId,
          paidAt: body.status === "PAID" ? (paidAt ? new Date(paidAt) : new Date()) : null,
        },
      });
      const sync = await syncOrderPayment(tx, orderId, claims.userId);
      return { code: 201, payment, sync } as const;
    });

    if (result.code === 404) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (result.code === 409) return NextResponse.json({ error: "This order is cancelled or refunded" }, { status: 409 });
    if (result.code === 400) return NextResponse.json({ error: `That is more than the remaining balance of ${result.balanceDue}` }, { status: 400 });
    await issueInvoiceSafely(result.payment.orderId);
    return NextResponse.json({ id: result.payment.id, orderPaymentStatus: result.sync?.paymentStatus }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    if ((e as { code?: string })?.code === "P2002") return NextResponse.json({ error: "That reference is already used by another payment" }, { status: 409 });
    console.error("POST /api/orders/[id]/payments:", e);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}