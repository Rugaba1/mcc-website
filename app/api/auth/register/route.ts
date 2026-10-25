import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ROLE_IDS } from "@/lib/constants";
import { Prisma } from "@/lib/generated/prisma/client";
import { sendEmailVerificationLink } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { safeNext } from "@/lib/auth/safe-next";
import {
  checkEmailEligibility,
  normalizeEmail,
  PLUS_ALIASING_DOMAINS,
} from "@/lib/auth/email-hygiene";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { isEmailBlocklisted } from "@/lib/auth/email-blocklist";
import { getPublishedLegalDocuments, LEGAL_DOCUMENTS } from "@/lib/legal/documents";
import { siteConfig } from "@/config/site.config";
import { DEFAULT_REGULAR_PERMISSIONS } from "@/lib/permissions/catalog";
import { syncPermissions } from "@/lib/permissions/permissions";

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
  acceptedLegalVersionIds: z.array(z.number().int().positive()).min(3).max(3),
  next: z.string().max(2048).optional(),
}).strict();

const conflict = (message: string) =>
  NextResponse.json({ success: false, message }, { status: 409 });

export const POST = withRateLimit({
  interval: 60 * 60_000,
  uniqueTokenPerInterval: 5,
})(async (
  request: NextRequest,
  { clientIp, userAgent }: { clientIp: string | null; userAgent: string | null },
) => {
  try {
    const {
      firstName,
      lastName,
      email: submittedEmail,
      phoneNumber,
      password,
      acceptedLegalVersionIds,
      next: requestedNext,
    } = registerSchema.parse(await request.json());
    const next = safeNext(requestedNext ?? null);
    const email = normalizeEmail(submittedEmail);
    const currentLegalVersions = await getPublishedLegalDocuments();
    const requiredLegalIds = LEGAL_DOCUMENTS.flatMap(({ type }) => {
      const version = currentLegalVersions.get(type);
      return version ? [version.id] : [];
    }).sort((a, b) => a - b);
    const submittedLegalIds = [...new Set(acceptedLegalVersionIds)].sort((a, b) => a - b);
    if (
      requiredLegalIds.length !== LEGAL_DOCUMENTS.length ||
      submittedLegalIds.length !== requiredLegalIds.length ||
      submittedLegalIds.some((id, index) => id !== requiredLegalIds[index])
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Review and accept the current Terms and Conditions, Terms of Service, and Privacy Policy before creating your account.",
          code: "LEGAL_ACCEPTANCE_REQUIRED",
        },
        { status: requiredLegalIds.length === LEGAL_DOCUMENTS.length ? 409 : 503 },
      );
    }

    if (await isEmailBlocklisted(email)) {
      return NextResponse.json(
        { success: false, message: "This email address cannot be used to create an account." },
        { status: 409 },
      );
    }

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

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          password: passwordHash,
          isActive: true,
          emailVerifiedAt: null,
          // Role is never read from the request body. Everyone starts as a customer.
          role: { connect: [{ id: ROLE_IDS.CUSTOMER }] },
        },
        select: { id: true, email: true },
      });
      await syncPermissions(
        tx,
        createdUser.id,
        DEFAULT_REGULAR_PERMISSIONS,
        null,
      );
      await tx.legalAcceptance.createMany({
        data: requiredLegalIds.map((legalVersionId) => ({
          userId: createdUser.id,
          legalVersionId,
          ip: clientIp?.slice(0, 45) ?? null,
          userAgent,
        })),
      });
      return createdUser;
    });

    try {
      const token = createEmailVerificationToken(user.id, user.email);
      const origin = siteConfig.configuredSiteUrl
        ? new URL(siteConfig.configuredSiteUrl).origin
        : request.nextUrl.origin;
      const verifyUrl = new URL("/verify-email", origin);
      verifyUrl.searchParams.set("token", token);
      verifyUrl.searchParams.set("next", next);
      await sendEmailVerificationLink(user.email, firstName, verifyUrl.toString());
    } catch (error) {
      console.error("Verification message delivery failed:", error);
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        {
          success: false,
          message: "Could not send a verification email. Please try again.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Check your email for a verification link.",
        email: user.email,
        next,
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
});
