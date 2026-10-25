import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { sendContactReply } from "@/lib/email";

export const runtime = "nodejs";

const bodySchema = z.object({ reply: z.string().trim().min(1).max(5000) });

export const POST = withPermission(PERM.MESSAGES_REPLY)(
  async (request: NextRequest, context) => {

  const id = Number((await context.params!).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { reply } = bodySchema.parse(await request.json());

    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const orderRequest =
      /^\[ORDER_REQUEST:(CANCEL|REFUND):\d+\]\r?\nOrder: ([^\r\n]+)\r?\n\r?\nCustomer request:\r?\n([\s\S]*)$/.exec(
        msg.message,
      );
    const sent = await sendContactReply({
      to: msg.email,
      firstName: msg.firstName,
      reply,
      originalMessage: orderRequest
        ? `${orderRequest[1] === "CANCEL" ? "Order cancellation" : "Refund"} request for ${orderRequest[2]}:\n\n${orderRequest[3]}`
        : msg.message,
    });
    if (!sent) {
      return NextResponse.json(
        { error: "The email could not be sent. Check the SMTP settings." },
        { status: 502 },
      );
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        status: "REPLIED",
        replyText: reply,
        repliedAt: new Date(),
        repliedById: context.user.id,
      },
      select: { id: true, status: true, replyText: true, repliedAt: true },
    });

    return NextResponse.json({
      ...updated,
      repliedAt: updated.repliedAt?.toISOString() ?? null,
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: "Reply cannot be empty" },
        { status: 400 },
      );
    console.error("Contact reply error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
