import "server-only";

import { prisma } from "@/lib/prisma";
import {
  sendContactAcknowledgement,
  sendContactStaffAlert,
} from "@/lib/email";
import type {
  ContactEmailDeliveryType,
} from "@/lib/generated/prisma/client";

const MAX_ATTEMPTS = 8;
const CLAIM_LEASE_MS = 5 * 60_000;
const MAX_RETRY_DELAY_MS = 6 * 60 * 60_000;

export type ContactEmailDeliveryResult =
  | "sent"
  | "pending"
  | "failed"
  | "skipped";

function retryDelay(attempt: number) {
  return Math.min(60_000 * 2 ** Math.max(0, attempt - 1), MAX_RETRY_DELAY_MS);
}

async function sendDelivery(
  type: ContactEmailDeliveryType,
  message: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    projectType: string | null;
    message: string;
  },
) {
  if (type === "ACKNOWLEDGEMENT") {
    return sendContactAcknowledgement({
      to: message.email,
      firstName: message.firstName,
      message: message.message,
    });
  }

  return sendContactStaffAlert({
    name: `${message.firstName} ${message.lastName}`,
    email: message.email,
    phone: message.phone,
    projectType: message.projectType,
    message: message.message,
  });
}

export async function processContactEmailDelivery(
  id: number,
): Promise<ContactEmailDeliveryResult> {
  const now = new Date();
  const claim = await prisma.contactEmailDelivery.updateMany({
    where: {
      id,
      OR: [
        { status: "PENDING", availableAt: { lte: now } },
        { status: "PROCESSING", lockedUntil: { lte: now } },
      ],
    },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
      lastAttemptAt: now,
      lockedUntil: new Date(now.getTime() + CLAIM_LEASE_MS),
    },
  });
  if (claim.count !== 1) return "skipped";

  const delivery = await prisma.contactEmailDelivery.findUnique({
    where: { id },
    include: { contactMessage: true },
  });
  if (!delivery) return "skipped";

  let sent = false;
  try {
    sent = await sendDelivery(delivery.type, delivery.contactMessage);
  } catch (error) {
    console.error("Queued contact email threw during delivery.", {
      deliveryId: id,
      type: delivery.type,
      error,
    });
  }

  if (sent) {
    await prisma.$transaction(async (tx) => {
      await tx.contactEmailDelivery.update({
        where: { id },
        data: {
          status: "SENT",
          deliveredAt: new Date(),
          lockedUntil: null,
          lastError: null,
        },
      });
      if (delivery.type === "ACKNOWLEDGEMENT") {
        await tx.contactMessage.update({
          where: { id: delivery.contactMessageId },
          data: { ackSentAt: new Date() },
        });
      }
    });
    return "sent";
  }

  const failedPermanently = delivery.attempts >= MAX_ATTEMPTS;
  await prisma.contactEmailDelivery.update({
    where: { id },
    data: {
      status: failedPermanently ? "FAILED" : "PENDING",
      availableAt: new Date(now.getTime() + retryDelay(delivery.attempts)),
      lockedUntil: null,
      lastError: "SMTP_DELIVERY_FAILED",
    },
  });
  console.error("Queued contact email was not delivered.", {
    deliveryId: id,
    type: delivery.type,
    attempt: delivery.attempts,
    failedPermanently,
  });
  return failedPermanently ? "failed" : "pending";
}

export async function processDueContactEmailDeliveries(limit = 20) {
  const now = new Date();
  const due = await prisma.contactEmailDelivery.findMany({
    where: {
      OR: [
        { status: "PENDING", availableAt: { lte: now } },
        { status: "PROCESSING", lockedUntil: { lte: now } },
      ],
    },
    orderBy: { availableAt: "asc" },
    take: limit,
    select: { id: true },
  });

  const results: ContactEmailDeliveryResult[] = [];
  for (const { id } of due) {
    results.push(await processContactEmailDelivery(id));
  }
  return {
    claimed: results.filter((result) => result !== "skipped").length,
    sent: results.filter((result) => result === "sent").length,
    pending: results.filter((result) => result === "pending").length,
    failed: results.filter((result) => result === "failed").length,
  };
}
