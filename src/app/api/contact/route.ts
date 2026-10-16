import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendContactAcknowledgement, sendContactStaffAlert } from "@/lib/email";

export const runtime = "nodejs";

const PROJECT_TYPES = ["Residential", "Commercial", "Industrial", "Infrastructure", "Other"] as const;

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(20).optional(),
  projectType: z.enum(PROJECT_TYPES).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(5000),
  website: z.string().optional(), // honeypot: real users leave it empty
});

const OK = { success: true, message: "Message sent" };

export async function POST(request: NextRequest) {
  try {
    const data = schema.parse(await request.json());

    // Bots fill hidden fields. Pretend it worked, store nothing.
    if (data.website) return NextResponse.json(OK);

    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
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
        { success: false, message: "Too many messages. Please try again later." },
        { status: 429 },
      );
    }

    const saved = await prisma.contactMessage.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        projectType: data.projectType || null,
        message: data.message,
        ipHash,
      },
    });

    // The message is already stored, so a mail failure must not fail the request
    const [ackSent] = await Promise.all([
      sendContactAcknowledgement({
        to: data.email,
        firstName: data.firstName,
        message: data.message,
      }),
      sendContactStaffAlert({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        projectType: data.projectType,
        message: data.message,
      }),
    ]);

    if (ackSent) {
      await prisma.contactMessage.update({
        where: { id: saved.id },
        data: { ackSentAt: new Date() },
      });
    }

    return NextResponse.json(OK, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    console.error("Contact error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}