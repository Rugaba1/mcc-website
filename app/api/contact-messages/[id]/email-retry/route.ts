import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { processContactEmailDelivery } from "@/lib/contact-email-queue";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

export const runtime = "nodejs";

const bodySchema = z.object({
  type: z.enum(["ACKNOWLEDGEMENT", "STAFF_ALERT"]),
});

export const POST = withPermission(PERM.MESSAGES_MANAGE)(
  async (request: NextRequest, context) => {
    const messageId = Number((await context.params!).id);
    if (!Number.isSafeInteger(messageId) || messageId <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    try {
      const { type } = bodySchema.parse(await request.json());
      const delivery = await prisma.contactEmailDelivery.findUnique({
        where: {
          contactMessageId_type: { contactMessageId: messageId, type },
        },
        select: { id: true, status: true },
      });
      if (!delivery) {
        return NextResponse.json({ error: "Email delivery not found" }, { status: 404 });
      }
      if (delivery.status !== "FAILED") {
        return NextResponse.json(
          { error: "Only permanently failed emails can be retried" },
          { status: 409 },
        );
      }

      const reset = await prisma.contactEmailDelivery.updateMany({
        where: { id: delivery.id, status: "FAILED" },
        data: {
          status: "PENDING",
          availableAt: new Date(),
          lockedUntil: null,
          lastError: null,
        },
      });
      if (reset.count !== 1) {
        return NextResponse.json(
          { error: "Email delivery changed before it could be retried" },
          { status: 409 },
        );
      }

      await processContactEmailDelivery(delivery.id);
      const updated = await prisma.contactEmailDelivery.findUniqueOrThrow({
        where: { id: delivery.id },
        select: {
          id: true,
          type: true,
          status: true,
          attempts: true,
          lastAttemptAt: true,
          deliveredAt: true,
          lastError: true,
        },
      });
      return NextResponse.json({
        ...updated,
        lastAttemptAt: updated.lastAttemptAt?.toISOString() ?? null,
        deliveredAt: updated.deliveredAt?.toISOString() ?? null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid email delivery type" }, { status: 400 });
      }
      console.error("Contact email retry error:", error);
      return NextResponse.json(
        { error: "Could not retry email delivery" },
        { status: 500 },
      );
    }
  },
);
