import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ROLE_IDS } from "@/lib/constants";
import { Prisma } from "@/lib/generated/prisma/client";
import { sendWelcomeEmail } from "@/lib/email";
import {
  checkEmailEligibility,
  normalizeEmail,
  PLUS_ALIASING_DOMAINS,
} from "@/lib/auth/email-hygiene";
import { isValidPhoneNumber } from "libphonenumber-js/min";

export const runtime = "nodejs"; // bcryptjs + Prisma

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  phoneNumber: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .refine(isValidPhoneNumber, "Enter a valid phone number")
    .optional(),
  password: z.string().min(8).max(200),
});

const conflict = (message: string) =>
  NextResponse.json({ success: false, message }, { status: 409 });

export async function POST(request: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      email: submittedEmail,
      phoneNumber,
      password,
    } = registerSchema.parse(await request.json());
    const email = normalizeEmail(submittedEmail);

    const emailEligibility = await checkEmailEligibility(email);
    if (emailEligibility === "lists_unavailable") {
      return NextResponse.json(
        { success: false, message: "Sign-up email checks are temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }
    if (emailEligibility === "disposable") {
      return NextResponse.json(
        { success: false, message: "Please use a permanent email address. Temporary email addresses are not accepted." },
        { status: 400 },
      );
    }
    const domain = email.split("@").at(-1) ?? "";
    if (emailEligibility === "no_mx") {
      return NextResponse.json(
        { success: false, message: "This email domain cannot receive mail. Check the address and try again." },
        { status: 400 },
      );
    }

    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email },
          ...(phoneNumber ? [{ phoneNumber }] : []),
          ...(PLUS_ALIASING_DOMAINS.has(domain)
            ? [{ email: { endsWith: `@${domain}` } }]
            : []),
        ],
      },
      select: { email: true, phoneNumber: true },
    });
    if (existingUsers.some((user) => normalizeEmail(user.email) === email))
      return conflict("An account with that email already exists");
    if (
      phoneNumber &&
      existingUsers.some((user) => user.phoneNumber === phoneNumber)
    )
      return conflict("An account with that phone number already exists");

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        password: await bcrypt.hash(password, 12),
        isActive: true,
        // Role is never read from the request body. Everyone starts as a customer.
        role: { connect: [{ id: ROLE_IDS.CUSTOMER }] },
      },
      select: { id: true, email: true },
    });

    const welcomeSent = await sendWelcomeEmail(user.email, firstName);
    if (!welcomeSent)
      console.warn("Welcome email was not delivered; account creation succeeded.");

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. You can now sign in.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    // Two simultaneous sign-ups with the same email/phone slip past the check above
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return conflict("An account with those details already exists");
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
