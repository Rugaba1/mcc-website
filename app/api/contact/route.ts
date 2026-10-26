import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { PERM } from "@/lib/permissions/catalog";
import { processContactEmailDelivery } from "@/lib/contact-email-queue";

export const runtime = "nodejs";

const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Infrastructure",
  "Other",
] as const;

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((value) => !value || isValidPhoneNumber(value), "Enter a valid phone number")
    .optional(),
  projectType: z.enum(PROJECT_TYPES).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(5000),
  website: z.string().optional(), // honeypot: real users leave it empty
});

const OK = { success: true, message: "Message sent" };

export const POST = withRateLimit({
  interval: 60 * 60_000,
  uniqueTokenPerInterval: 5,
})(async (
  request: NextRequest,
  { clientIp }: { clientIp: string | null },
) => {
  try {
    const data = schema.parse(await request.json());

    // Bots fill hidden fields. Pretend it worked, store nothing.
    if (data.website) {
      return NextResponse.json({
        ...OK,
        confirmationSent: false,
        staffAlertSent: false,
      });
    }

    const ip = clientIp ?? "unknown";
    const ipHash = createHash("sha256")
      .update(ip + (process.env.CONTACT_IP_SALT ?? ""))
      .digest("hex");

    // Max 5 messages per hour per IP or per email
    const recent = await prisma.contactMessage.count({
      where: {
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
        OR: [{ ipHash }, { email: data.email }],
      },
    });
    if (recent >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many messages. Please try again later.",
        },
        { status: 429 },
      );
    }

    const saved = await prisma.$transaction(async (tx) => {
      const message = await tx.contactMessage.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          projectType: data.projectType || null,
          message: data.message,
          ipHash,
          emailDeliveries: {
            create: [
              { type: "ACKNOWLEDGEMENT" },
              { type: "STAFF_ALERT" },
            ],
          },
        },
        include: { emailDeliveries: { select: { id: true, type: true } } },
      });
      await tx.adminNotification.create({
        data: {
          type: "message",
          requiredPermission: PERM.MESSAGES_VIEW,
          title: "New contact message",
          message: `${data.firstName} ${data.lastName}${data.projectType ? ` · ${data.projectType}` : ""}`,
          targetPath: "/admin/messages",
          entityId: message.id,
        },
      });
      return message;
    });

    const deliveryResults = await Promise.all(
      saved.emailDeliveries.map(async (delivery) => {
        try {
          return [delivery.type, await processContactEmailDelivery(delivery.id)] as const;
        } catch (error) {
          console.error("Initial contact email delivery attempt failed.", {
            contactMessageId: saved.id,
            deliveryId: delivery.id,
            type: delivery.type,
            error,
          });
          return [delivery.type, "pending"] as const;
        }
      }),
    );
    const ackSent = deliveryResults.some(
      ([type, result]) => type === "ACKNOWLEDGEMENT" && result === "sent",
    );
    const staffAlertSent = deliveryResults.some(
      ([type, result]) => type === "STAFF_ALERT" && result === "sent",
    );

    return NextResponse.json(
      { ...OK, confirmationSent: ackSent, staffAlertSent },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message ?? "Invalid input",
        },
        { status: 400 },
      );
    }
    console.error("Contact error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
});
