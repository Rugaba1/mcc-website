import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";
import { syncOrderPayment } from "@/lib/payments/sync";
import { blankToNull } from "@/lib/variant";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  providerRef: z.string().trim().min(4, "Enter the transaction ID or reference").max(150).nullable().optional(),
  payerPhone: z.string().trim().max(20).nullable().optional(),
  note: z.string().trim().max(255).nullable().optional(),
});

const idOf = async (ctx: Ctx) => {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Only the customer's own, still-pending manual payments can be touched
const findEditable = (id: number, userId: number) =>
  prisma.payment.findFirst({
    where: { id, order: { userId }, status: "PENDING", provider: "manual" },
    select: { id: true, orderId: true },
  });

export const PATCH = withAuth(async (req: NextRequest, { user, ...ctx }) => {
  const id = await idOf(ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const data = blankToNull(schema.parse(await req.json()));
    const p = await findEditable(id, user.id);
    if (!p) return NextResponse.json({ error: "This payment can no longer be edited" }, { status: 409 });
    await prisma.payment.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    if ((e as { code?: string })?.code === "P2002") return NextResponse.json({ error: "That transaction ID has already been used" }, { status: 409 });
    console.error("PATCH /api/me/payments/[id]:", e);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, { user, ...ctx }) => {
  const id = await idOf(ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const p = await findEditable(id, user.id);
    if (!p) return NextResponse.json({ error: "This payment can no longer be withdrawn" }, { status: 409 });
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });
      await syncOrderPayment(tx, p.orderId, user.id);
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/me/payments/[id]:", e);
    return NextResponse.json({ error: "Failed to withdraw payment" }, { status: 500 });
  }
});