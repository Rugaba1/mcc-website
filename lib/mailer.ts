import "server-only";

import { Resend, type CreateEmailOptions } from "resend";
import { serverConfig } from "@/config/server.config";

type MailOptions = {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
};

let resendClient: Resend | null | undefined;
let warnedMissingConfig = false;

function getResendClient(): Resend | null {
  if (resendClient !== undefined) return resendClient;

  const { apiKey } = serverConfig.resend;
  if (!apiKey) {
    if (!warnedMissingConfig) {
      console.warn(
        "Email delivery is disabled. Configure RESEND_API_KEY.",
      );
      warnedMissingConfig = true;
    }
    resendClient = null;
    return resendClient;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function deliverMail(options: MailOptions): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;
  if (!options.from) {
    console.error("Email delivery is disabled because EMAIL_FROM is invalid.");
    return false;
  }
  if (!options.html && !options.text) {
    console.error("Email delivery is disabled because the message body is empty.");
    return false;
  }

  try {
    const shared = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    };
    const payload: CreateEmailOptions = options.html
      ? {
          ...shared,
          html: options.html,
          ...(options.text ? { text: options.text } : {}),
        }
      : { ...shared, text: options.text! };
    const { data, error } = await client.emails.send(payload);
    if (error) {
      console.error("Resend email delivery failed.", {
        code: error.name,
        statusCode: error.statusCode,
      });
      return false;
    }
    if (!data?.id) {
      console.error("Resend accepted no email delivery request.", {
        code: "MISSING_MESSAGE_ID",
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("Resend email delivery failed.", {
      code: error instanceof Error ? error.name : "UNKNOWN",
    });
    return false;
  }
}
