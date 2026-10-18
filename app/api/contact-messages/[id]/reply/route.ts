import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireStaff } from "../../../../../lib/auth/require-staff";
import { sendContactReply } from "../../../../../lib/email";

export const runtime = "nodejs";

const bodySchema = z.object({ reply: z.string().trim().min(1).max(5000) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { claims, error } = await requireStaff(request);
  if (error) return error;

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { reply } = bodySchema.parse(await request.json());

    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sent = await sendContactReply({
      to: msg.email,
      firstName: msg.firstName,
      reply,
      originalMessage: msg.message,
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
        repliedById: claims.userId,
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
}
