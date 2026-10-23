import "server-only";

import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;
let warnedMissingConfig = false;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
    if (!warnedMissingConfig) {
      console.warn(
        "Email delivery is disabled. Configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD.",
      );
      warnedMissingConfig = true;
    }
    transporter = null;
    return transporter;
  }

  const port = Number(process.env.EMAIL_PORT || "587");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("Email delivery is disabled because EMAIL_PORT is invalid.");
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port,
    secure: process.env.EMAIL_SECURE === "true" || port === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  });
  return transporter;
}

export async function deliverMail(options: SendMailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();
    if (!transport) return false;
    const result = await transport.sendMail(options);
    if (result.rejected.length > 0 || result.accepted.length === 0) {
      console.error("Email recipient was rejected by the SMTP server.", {
        code: "RECIPIENT_REJECTED",
        responseCode: result.responseCode,
        rejectedCount: result.rejected.length,
      });
      return false;
    }
    return true;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "UNKNOWN";
    const responseCode =
      error && typeof error === "object" && "responseCode" in error
        ? Number(error.responseCode)
        : undefined;
    const command =
      error && typeof error === "object" && "command" in error
        ? String(error.command)
        : undefined;
    console.error("Email delivery failed.", { code, responseCode, command });
    return false;
  }
}
