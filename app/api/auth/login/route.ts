import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/auth/jwt";
import { IS_PROD, ROLE_IDS, WEEK } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";
import { normalizeEmail } from "@/lib/auth/email-hygiene";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { createRefreshSession } from "@/lib/auth/refresh-tokens";
import { permissionsForAccount } from "@/lib/permissions/core";
import {
  issueStatelessOtp,
  otpBinding,
  verifyStatelessChallenge,
  verifyStatelessOtp,
} from "@/lib/auth/stateless-otp";
import {
  sendEmailVerificationLink,
  sendStatelessOtpEmail,
} from "@/lib/email";
import { decryptTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { safeNext } from "@/lib/auth/safe-next";
import { isEmailBlocklisted } from "@/lib/auth/email-blocklist";

export const runtime = "nodejs"; // bcryptjs + Prisma

const loginSchema = z
  .object({
    identifier: z.string().trim().min(1).max(254),
    password: z.string().min(1).max(200),
    challenge: z.string().max(2048).optional(),
    code: z.string().regex(/^\d{6}$/).optional(),
    next: z.string().max(2048).optional(),
  })
  .strict();

// Compared against when the user doesn't exist, so response time doesn't reveal which emails are registered
let dummyHash: string | null = null;
const getDummyHash = () =>
  (dummyHash ??= bcrypt.hashSync("not-a-real-password", 10));

const invalid = () =>
  NextResponse.json(
    { success: false, message: "Invalid credentials" },
    { status: 401 },
  );

export const POST = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 10,
})(async (request: NextRequest) => {
  try {
    const {
      identifier,
      password,
      challenge,
      code,
      next: requestedNext,
    } = loginSchema.parse(await request.json());
    const next = safeNext(requestedNext ?? null);

    let user;
    if (identifier.includes("@")) {
      const normalizedEmail = normalizeEmail(identifier);
      user = await prisma.user.findFirst({
        where: { email: normalizedEmail },
        include: {
          role: true,
          permissions: { include: { permission: true } },
        },
      });
      // Keep sign-in working for accounts created before alias normalization.
      if (!user && normalizedEmail !== identifier.toLowerCase()) {
        user = await prisma.user.findFirst({
          where: { email: identifier.toLowerCase() },
          include: {
            role: true,
            permissions: { include: { permission: true } },
          },
        });
      }
    } else {
      user = await prisma.user.findFirst({
        where: { phoneNumber: identifier },
        include: {
          role: true,
          permissions: { include: { permission: true } },
        },
      });
    }

    // Always run one bcrypt comparison
    const passwordOk = await bcrypt.compare(
      password,
      user?.password ?? getDummyHash(),
    );
    if (!user || !passwordOk) return invalid();

    // Only reveal "inactive" after the password is verified
    if (!user.isActive || (await isEmailBlocklisted(user.email))) {
      return NextResponse.json(
        {
          success: true,
          accountDisabled: true,
          message: "This account cannot sign in. Please contact support.",
        },
        { status: 202 },
      );
    }

    if (!user.emailVerifiedAt) {
      try {
        const token = createEmailVerificationToken(user.id, user.email);
        const origin = siteConfig.configuredSiteUrl
          ? new URL(siteConfig.configuredSiteUrl).origin
          : request.nextUrl.origin;
        const verifyUrl = new URL("/verify-email", origin);
        verifyUrl.searchParams.set("token", token);
        verifyUrl.searchParams.set("next", next);
        await sendEmailVerificationLink(
          user.email,
          user.firstName,
          verifyUrl.toString(),
        );
      } catch (error) {
        console.error("Login verification email delivery failed:", error);
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
          emailVerificationRequired: true,
          message: "Check your email for a verification link.",
        },
        { status: 202 },
      );
    }

    const isRegular = user.role.some((role) => role.id === ROLE_IDS.CUSTOMER);
    const permissions = [
      ...permissionsForAccount(
        user.permissions.map(({ permission }) => permission.code),
        isRegular ? "regular" : "staff",
      ),
    ];
    const isStaff = !isRegular;
    const twoFactorMethod = user.twoFactorEnabled
      ? user.twoFactorMethod
      : isStaff
        ? "email"
        : null;

    if (twoFactorMethod) {
      if (!challenge || !code) {
        if (
          twoFactorMethod === "authenticator" &&
          (!user.twoFactorSecret || !user.twoFactorEnabled)
        ) {
          return NextResponse.json(
            { success: false, message: "Two-factor authentication needs setup." },
            { status: 403 },
          );
        }
        const issued = issueStatelessOtp(
          {
            purpose: "login",
            subject: String(user.id),
            binding: otpBinding(
              `${user.id}:${user.password}:${twoFactorMethod}`,
            ),
          },
          5 * 60_000,
        );
        if (twoFactorMethod === "email") {
          await sendStatelessOtpEmail(
            user.email,
            issued.code,
            user.firstName,
            "login",
          );
        }
        return NextResponse.json(
          {
            success: true,
            twoFactorRequired: true,
            method: twoFactorMethod,
            challenge: issued.challenge,
            message:
              twoFactorMethod === "email"
                ? "A verification code was sent to your email."
                : "Enter the code from your authenticator app.",
          },
          { status: 202 },
        );
      }

      const verified =
        twoFactorMethod === "authenticator"
          ? verifyStatelessChallenge(challenge, "login")
          : verifyStatelessOtp(challenge, code, "login");
      if (
        !verified ||
        verified.subject !== String(user.id) ||
        verified.binding !==
          otpBinding(`${user.id}:${user.password}:${twoFactorMethod}`) ||
        (twoFactorMethod === "authenticator" &&
          (!user.twoFactorSecret ||
            !verifyTotp(decryptTotpSecret(user.twoFactorSecret), code)))
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired verification code." },
          { status: 401 },
        );
      }

      if (!user.twoFactorEnabled && isStaff) {
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: true, twoFactorMethod: "email" },
        });
      }
    }

    const primaryRole = [...user.role].sort((a, b) => a.id - b.id)[0] ?? {
      id: ROLE_IDS.CUSTOMER,
      roleName: "customer",
    };

    const refreshSession = await createRefreshSession(user.id, request);
    const accessToken = await generateAccessToken({
      userId: user.id,
      sessionId: refreshSession.sessionId,
      permissions,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const res = NextResponse.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: { id: primaryRole.id, roleName: primaryRole.roleName },
        permissions,
      },
    });

    res.cookies.set("refresh_token", refreshSession.token, {
      path: "/api/auth",
      maxAge: WEEK,
      sameSite: "lax",
      httpOnly: true,
      secure: IS_PROD,
    });

    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
});
