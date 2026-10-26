import "server-only";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { visit } from "unist-util-visit";
import { unified } from "unified";
import type { Root } from "mdast";
import { deliverMail } from "@/lib/mailer";
import { siteConfig } from "@/config/site.config";
import { serverConfig } from "@/config/server.config";

type SendMailOptions = Parameters<typeof deliverMail>[0];

const companyName = siteConfig.companyName;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const multiline = (s: string) => esc(s).replace(/\r?\n/g, "<br>");
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim(); // for subjects
const parseAddress = (value: string) => {
  const bracketAddress = /<\s*([^<>]+)\s*>/.exec(value)?.[1]?.trim();
  const address = bracketAddress ?? value.trim();
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(address)) return null;
  return { name: companyName, address };
};
const sender = () =>
  parseAddress(siteConfig.emailFrom || serverConfig.smtp.user) ?? undefined;
const supportAddress = () =>
  parseAddress(siteConfig.emailReplyTo) ||
  parseAddress(siteConfig.companyEmail);
const adminEmail = () =>
  parseAddress(serverConfig.adminEmail)?.address ||
  supportAddress()?.address ||
  parseAddress(serverConfig.smtp.user)?.address ||
  null;

const footerDetails = [
  siteConfig.companyAddress,
  siteConfig.companyTin && `TIN: ${siteConfig.companyTin}`,
  siteConfig.companyRegistrationNumber &&
    `Registration no.: ${siteConfig.companyRegistrationNumber}`,
  [
    [siteConfig.companyPhone, siteConfig.companyPhoneAlternate]
      .filter(Boolean)
      .join(" · "),
    [siteConfig.companyEmail, siteConfig.companySalesEmail]
      .filter(Boolean)
      .join(" · "),
  ]
    .filter(Boolean)
    .join(" | "),
  siteConfig.companyWebsite,
].filter(Boolean);

function absoluteMarkdownUrls() {
  return (tree: Root) => {
    visit(tree, ["link", "image"], (node) => {
      if (!("url" in node) || typeof node.url !== "string") return;
      if (
        node.url.startsWith("/") &&
        !node.url.startsWith("//")
      ) {
        node.url = new URL(node.url, siteConfig.siteUrl).toString();
      }
    });
  };
}

function styleNewsletterContent(html: string) {
  return html
    .replace(/<h1\b/g, '<h1 style="margin:24px 0 12px;color:#004f46;font-size:26px;line-height:1.25;"')
    .replace(/<h2\b/g, '<h2 style="margin:22px 0 10px;color:#004f46;font-size:22px;line-height:1.3;"')
    .replace(/<h3\b/g, '<h3 style="margin:18px 0 8px;color:#004f46;font-size:18px;line-height:1.35;"')
    .replace(/<p\b/g, '<p style="margin:0 0 16px;line-height:1.7;"')
    .replace(/<a\b/g, '<a style="color:#00574f;text-decoration:underline;"')
    .replace(/<img\b/g, '<img style="display:block;max-width:100%;height:auto;margin:16px 0;border:0;"')
    .replace(/<blockquote\b/g, '<blockquote style="margin:20px 0;padding:12px 16px;border-left:3px solid #d6b43e;background:#fffcf5;color:#40524c;"')
    .replace(/<ul\b/g, '<ul style="margin:0 0 16px;padding-left:24px;"')
    .replace(/<ol\b/g, '<ol style="margin:0 0 16px;padding-left:24px;"')
    .replace(/<table\b/g, '<table style="width:100%;border-collapse:collapse;margin:16px 0;"')
    .replace(/<th\b/g, '<th style="padding:8px;border:1px solid #d8ded9;background:#edf3f1;text-align:left;"')
    .replace(/<td\b/g, '<td style="padding:8px;border:1px solid #d8ded9;text-align:left;"')
    .replace(/<hr\b/g, '<hr style="height:1px;margin:24px 0;border:0;background:#d8ded9;"');
}

const shell = (
  title: string,
  body: string,
  footerCopy = "This is a transactional message about your account, enquiry, or order. For assistance, reply to this email or use the contact details above.",
) => `
  <!doctype html>
  <html lang="en">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
    <body style="margin:0;background:#fffcf5;padding:24px 12px;color:#1a2b27;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr><td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border:1px solid #eadfb8;background:#ffffff;border-collapse:collapse;">
            <tr><td style="padding:22px 24px;background:#004f46;color:#ffffff;border-bottom:4px solid #d6b43e;">
              <p style="margin:0;color:#fdf1dc;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${esc(companyName)}</p>
              <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:24px;font-weight:700;">${title}</h1>
            </td></tr>
            <tr><td style="padding:24px;line-height:1.65;">${body}</td></tr>
            <tr><td style="padding:16px 24px;border-top:1px solid #eadfb8;color:#5f6b63;font-size:12px;line-height:1.6;">
              <p style="margin:0 0 8px;font-weight:bold;color:#004f46;">${esc(companyName)}</p>
              ${footerDetails.map((detail) => `<p style="margin:2px 0;">${esc(String(detail))}</p>`).join("")}
              <p style="margin:10px 0 0;">${esc(footerCopy)}</p>
              <p style="margin:8px 0 0;">&copy; ${new Date().getFullYear()} ${esc(companyName)}</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;

export async function sendNewsletterConfirmation(
  to: string,
  confirmationLink: string,
  unsubscribeLink: string,
) {
  return safeSendMail({
    from: sender(),
    to,
    subject: `Confirm your newsletter subscription to ${companyName}`,
    html: shell(
      "Confirm your subscription",
      `      <p>We received a request to receive news and updates from ${esc(companyName)}.</p>
      <p><a href="${esc(confirmationLink)}" style="display:inline-block;padding:12px 20px;background:#004f46;color:#fff;text-decoration:none;">Confirm subscription</a></p>
      <p>This link expires in 24 hours. You will not receive marketing emails unless you confirm. If you did not request this, ignore this email.</p>
      <p>You can also <a href="${esc(unsubscribeLink)}">cancel this request or unsubscribe later</a>.</p>`,
      "You are receiving this confirmation because someone entered your email address on our website. No marketing emails will be sent unless you confirm.",
    ),
    text: `We received a request to subscribe ${to} to ${companyName} news and updates.\n\nConfirm your subscription: ${confirmationLink}\n\nThis link expires in 24 hours. You will not receive marketing emails unless you confirm. If you did not request this, ignore this email.\n\nCancel this request or unsubscribe later: ${unsubscribeLink}`,
  });
}

/** Acknowledgement sent to the person who used the contact form. */
export async function sendContactAcknowledgement(p: {
  to: string;
  firstName: string;
  message: string;
}) {
  return safeSendMail({
    from: sender(),
    to: p.to,
    subject: `We received your message – ${companyName}`,
    html: shell(
      `Thank you, ${esc(p.firstName)}`,
      `<p>We have received your message and our team will reply within 24 hours on business days.</p>
       <p style="margin-top:16px;"><strong>Your message:</strong></p>
       <blockquote style="margin:8px 0; padding-left:12px; border-left:3px solid #ccc;">${multiline(p.message)}</blockquote>
       <p>If it is urgent, call us on ${esc(siteConfig.companyPhone)}.</p>`,
    ),
    text: `Hi ${p.firstName},\n\nWe received your message and will reply within 24 hours on business days.\n\nYour message:\n${p.message}`,
  });
}

export async function sendNewsletterCampaignEmail(p: {
  to: string;
  subject: string;
  markdown: string;
  unsubscribeLink: string;
}) {
  const content = styleNewsletterContent(String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(absoluteMarkdownUrls)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify)
      .process(p.markdown),
  ));
  return safeSendMail({
    from: sender(),
    to: p.to,
    subject: oneLine(p.subject),
    html: shell(
      esc(oneLine(p.subject)),
      `<div style="font-size:16px;line-height:1.7;">${content}</div>
       <p style="margin-top:24px;font-size:12px;color:#5f6b63;">
         You are receiving this marketing email because you confirmed a newsletter subscription.
         <a href="${esc(p.unsubscribeLink)}" style="color:#004f46;">Unsubscribe</a>
       </p>`,
      "You subscribed to Mountain Ceramics news and updates. You can unsubscribe using the link above.",
    ),
    text: `${p.markdown}\n\nYou are receiving this email because you confirmed a newsletter subscription.\nUnsubscribe: ${p.unsubscribeLink}`,
  });
}


async function safeSendMail(mailOptions: SendMailOptions) {
  const from = sender();
  if (!from) {
    console.error(
      "Email delivery skipped because EMAIL_FROM or the authenticated SMTP account is not a valid sender address.",
    );
    return false;
  }
  if (!siteConfig.emailFrom) {
    console.warn(
      "EMAIL_FROM is not configured; using EMAIL_USER. Configure an address on a domain with valid SPF, DKIM, and DMARC.",
    );
  }
  const defaultReplyTo = supportAddress();
  return deliverMail({
    ...mailOptions,
    from,
    ...(mailOptions.replyTo || !defaultReplyTo
      ? {}
      : { replyTo: defaultReplyTo }),
  });
}

/** Alert to the internal inbox. Reply-To is the visitor, so "Reply" in your mail app works. */
export async function sendContactStaffAlert(p: {
  name: string;
  email: string;
  phone?: string | null;
  projectType?: string | null;
  message: string;
}) {
  const recipient = adminEmail();
  if (!recipient) {
    console.error(
      "Staff email notification skipped because no valid ADMIN_EMAIL, support email, or SMTP user is configured.",
    );
    return false;
  }
  return safeSendMail({
    from: sender(),
    to: recipient,
    replyTo: p.email,
    subject: oneLine(`[${companyName}] New message from ${p.name}`),
    html: shell(
      "New website message",
      `<p><strong>Name:</strong> ${esc(p.name)}</p>
       <p><strong>Email:</strong> ${esc(p.email)}</p>
       <p><strong>Phone:</strong> ${esc(p.phone || "—")}</p>
       <p><strong>Project type:</strong> ${esc(p.projectType || "—")}</p>
       <p style="margin-top:16px;">${multiline(p.message)}</p>`,
    ),
    text: `From: ${p.name} <${p.email}>\nPhone: ${p.phone || "-"}\nProject: ${p.projectType || "-"}\n\n${p.message}`,
  });
}

/** Staff reply sent from the admin inbox. */
export async function sendContactReply(p: {
  to: string;
  firstName: string;
  reply: string;
  originalMessage: string;
}) {
  return safeSendMail({
    from: sender(),
    to: p.to,
    replyTo: adminEmail() || supportAddress()?.address || sender() || undefined,
    subject: oneLine(`Re: your message to ${companyName}`),
    html: shell(
      `Hi ${esc(p.firstName)},`,
      `<p>${multiline(p.reply)}</p>
       <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
       <p style="font-size:12px; color:#666;">Your original message:</p>
       <blockquote style="margin:8px 0; padding-left:12px; border-left:3px solid #ccc; color:#666;">${multiline(p.originalMessage)}</blockquote>`,
    ),
    text: `Hi ${p.firstName},\n\n${p.reply}\n\n---\nYour original message:\n${p.originalMessage}`,
  });
}


export async function sendStatelessOtpEmail(
  to: string,
  code: string,
  firstName: string,
  purpose: "login" | "two-factor-enrollment",
) {
  const title =
    purpose === "login"
      ? "Sign-in verification code"
      : "Two-factor setup code";
  const subject =
    purpose === "login"
      ? "Your sign-in verification code"
      : "Verify two-factor authentication";
  const sent = await safeSendMail({
    from: sender(),
    to,
    subject,
    html: shell(
      title,
      `<p>Hi ${esc(firstName)},</p>
       <p>Your verification code is:</p>
       <p style="padding:16px;border:1px solid #eadfb8;background:#fffcf5;color:#004f46;font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;">${esc(code)}</p>
       <p>This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>`,
    ),
    text: `Hi ${firstName},\n\nYour ${subject.toLowerCase()} is ${code}. It expires in 5 minutes. If you did not request it, ignore this email.`,
  });
  if (!sent) throw new Error("Failed to send verification code");
}

export async function sendPasswordResetLink(
  to: string,
  firstName: string,
  link: string,
) {
  const sent = await safeSendMail({
    from: sender(),
    to,
    subject: "Reset your password",
    html: shell(
      "Password reset",
      `<p>Hi ${esc(firstName)},</p>
       <p>Use the secure link below to choose a new password.</p>
       <p><a href="${esc(link)}" style="display:inline-block;padding:12px 20px;background:#004f46;color:#fff;text-decoration:none;">Reset password</a></p>
       <p>This link expires in 30 minutes. If you did not request a password reset, you can ignore this email.</p>`,
    ),
    text: `Hi ${firstName},\n\nUse this secure link to choose a new password:\n${link}\n\nThis link expires in 30 minutes. If you did not request a password reset, ignore this email.`,
  });
  if (!sent) throw new Error("Failed to send password reset link");
}

export async function sendEmailVerificationLink(
  to: string,
  firstName: string,
  link: string,
) {
  const sent = await safeSendMail({
    from: sender(),
    to,
    subject: `Verify your email for ${companyName}`,
    html: shell(
      `Welcome, ${esc(firstName)}`,
      `<p>Confirm your email address to finish creating your account.</p>
       <p><a href="${esc(link)}" style="display:inline-block;padding:12px 20px;background:#004f46;color:#fff;text-decoration:none;">Verify email</a></p>
       <p>This link expires in 24 hours. If you did not create an account, you can ignore this message.</p>`,
    ),
    text: `Hi ${firstName},\n\nVerify your email address to finish creating your account:\n${link}\n\nThis link expires in 24 hours. If you did not create an account, ignore this message.`,
  });
  if (!sent) throw new Error("Failed to send email verification link");
}

export async function sendPasswordChangedEmail(to: string, firstName: string) {
  return safeSendMail({
    from: sender(),
    to,
    subject: "Password Changed Successfully",
    html: shell(
      "Password changed",
      `<p>Hi ${esc(firstName)},</p>
       <p>This email confirms your password was changed.</p>
       <p>If you did not make this change, contact our support team immediately.</p>`,
    ),
    text: `Hi ${firstName},\n\nThis email confirms that your password was successfully changed.\n\nIf you didn't change your password, please contact our support team immediately and secure your account.`,
  });
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  return safeSendMail({
    from: sender(),
    to,
    subject: `Welcome to ${companyName}`,
    html: shell(
      `Welcome, ${esc(firstName)}`,
      `<p>Thank you for creating an account with ${esc(companyName)}.</p>
       <p>Your customer account is ready. Browse our tiles, save favourites, and create room designs.</p>
       <p>If you need help, our team is ready to assist.</p>`,
    ),
    text: `Welcome ${firstName}! Your account with ${companyName} is ready.`,
  });
}

export async function sendCustomerNotificationEmail({
  to,
  firstName,
  subject,
  message,
}: {
  to: string;
  firstName: string;
  subject: string;
  message: string;
}) {
  return safeSendMail({
    from: sender(),
    to,
    subject: oneLine(subject),
    html: shell(`Hi ${esc(firstName)},`, `<p>${multiline(message)}</p>`),
    text: `Hi ${firstName},\n\n${message}`,
  });
}

export async function sendAdminNotificationEmail({
  to = adminEmail() ?? undefined,
  name,
  email,
  subject,
  message,
}: {
  to?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const recipient = to?.trim() || adminEmail();
  if (!recipient) {
    console.error(
      "Staff email notification skipped because no valid ADMIN_EMAIL, support email, or SMTP user is configured.",
    );
    return false;
  }
  return safeSendMail({
    from: sender(),
    to: recipient,
    subject: oneLine(`[${companyName}] ${subject}`),
    html: shell(
      "New customer notification",
      `<p><strong>Name:</strong> ${esc(name)}</p>
       <p><strong>Email:</strong> ${esc(email)}</p>
       <p><strong>Subject:</strong> ${esc(subject)}</p>
       <div style="padding:16px;border:1px solid #eadfb8;background:#fffcf5;white-space:pre-wrap;">${multiline(message)}</div>`,
    ),
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
  });
}

export async function sendOrderPlacedEmail(p: {
  to: string;
  firstName: string;
  orderNumber: string;
  currency: string;
  subtotal: string;
  discount?: string;
  couponCode?: string;
  shipping: string;
  tax: string;
  total: string;
  fulfillment: string;
  paymentMethod: string;
  paymentInstructions?: string;
  deliveryAddress?: string;
  orderUrl: string;
  invoiceUrl?: string;
  items: Array<{
    name: string;
    size: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
}) {
  const rows = p.items.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eadfb8;">${esc(item.name)}<br><span style="color:#5f6b63;font-size:12px;">${esc(item.size)}</span></td>
      <td align="right" style="padding:8px;border-bottom:1px solid #eadfb8;">${esc(item.quantity)}</td>
      <td align="right" style="padding:8px;border-bottom:1px solid #eadfb8;">${esc(item.unitPrice)}</td>
      <td align="right" style="padding:8px;border-bottom:1px solid #eadfb8;font-weight:bold;">${esc(item.lineTotal)}</td>
    </tr>`).join("");
  const invoiceLink = p.invoiceUrl
    ? `<p><a href="${esc(p.invoiceUrl)}" style="display:inline-block;padding:12px 18px;background:#004f46;color:#ffffff;text-decoration:none;">View pro forma invoice</a></p>`
    : "";
  const delivery = p.deliveryAddress
    ? `<p><strong>Delivery address:</strong><br>${multiline(p.deliveryAddress)}</p>`
    : "";
  const paymentInstructions = p.paymentInstructions
    ? `<p><strong>Payment instructions:</strong><br>${multiline(p.paymentInstructions)}</p>`
    : "";
  const discount = p.discount
    ? `<tr><td style="padding:4px 12px 4px 0;">Discount${p.couponCode ? ` (${esc(p.couponCode)})` : ""}</td><td align="right">-${esc(p.discount)}</td></tr>`
    : "";
  const subject = `Order ${oneLine(p.orderNumber)} received`;
  const textItems = p.items
    .map((item) => `${item.name} (${item.size}) × ${item.quantity}: ${item.lineTotal}`)
    .join("\n");

  return safeSendMail({
    from: sender() || undefined,
    to: p.to,
    subject: oneLine(subject),
    html: shell(
      "Order confirmation",
      `<p>Hi ${esc(p.firstName)},</p>
       <p>We have received your order. Its current status is pending; we will email you when it changes.</p>
       <p><strong>Order number:</strong> ${esc(p.orderNumber)}<br>
       <strong>Fulfilment:</strong> ${esc(p.fulfillment)}<br>
       <strong>Payment method:</strong> ${esc(p.paymentMethod)}</p>
       ${paymentInstructions}
       ${delivery}
       <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px;">
         <thead><tr style="background:#004f46;color:#ffffff;">
           <th align="left" style="padding:8px;">Item</th>
           <th align="right" style="padding:8px;">Quantity</th>
           <th align="right" style="padding:8px;">Unit price</th>
           <th align="right" style="padding:8px;">Total</th>
         </tr></thead><tbody>${rows}</tbody>
       </table>
       <table role="presentation" cellspacing="0" cellpadding="0" style="margin:12px 0 20px auto;font-size:14px;">
         <tr><td style="padding:4px 12px 4px 0;">Subtotal</td><td align="right">${esc(p.subtotal)}</td></tr>
         ${discount}
         <tr><td style="padding:4px 12px 4px 0;">Delivery</td><td align="right">${esc(p.shipping)}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;">Tax</td><td align="right">${esc(p.tax)}</td></tr>
         <tr><td style="padding:8px 12px 4px 0;border-top:1px solid #eadfb8;font-weight:bold;">Total (${esc(p.currency)})</td><td align="right" style="padding-top:8px;border-top:1px solid #eadfb8;font-weight:bold;">${esc(p.total)}</td></tr>
       </table>
       <p><a href="${esc(p.orderUrl)}" style="display:inline-block;padding:12px 18px;background:#004f46;color:#ffffff;text-decoration:none;">View your orders</a></p>
       ${invoiceLink}`,
    ),
    text: `Hi ${p.firstName},

We received your order. Its current status is pending; we will email you when it changes.
Order number: ${p.orderNumber}
Fulfilment: ${p.fulfillment}
Payment method: ${p.paymentMethod}
${p.paymentInstructions ? `Payment instructions:\n${p.paymentInstructions}\n` : ""}
${p.deliveryAddress ? `Delivery address:\n${p.deliveryAddress}\n` : ""}

Items:
${textItems}

Subtotal: ${p.subtotal}
${p.discount ? `Discount${p.couponCode ? ` (${p.couponCode})` : ""}: -${p.discount}\n` : ""}\
Delivery: ${p.shipping}
Tax: ${p.tax}
Total (${p.currency}): ${p.total}

View your orders: ${p.orderUrl}${p.invoiceUrl ? `\nView pro forma invoice: ${p.invoiceUrl}` : ""}`,
  });
}

export async function sendOrderStatusEmail(p: {
  to: string;
  firstName: string;
  orderNumber: string;
  status: string;
}) {
  return sendCustomerNotificationEmail({
    to: p.to,
    firstName: p.firstName,
    subject: `Order ${oneLine(p.orderNumber)} update`,
    message: `Your order ${p.orderNumber} is now ${p.status.toLowerCase().replace(/_/g, " ")}.`,
  });
}

export async function sendPaymentStatusEmail(p: {
  to: string;
  firstName: string;
  orderNumber: string;
  status: string;
  amount: string;
  currency: string;
}) {
  return sendCustomerNotificationEmail({
    to: p.to,
    firstName: p.firstName,
    subject: `Payment update for order ${oneLine(p.orderNumber)}`,
    message: `The payment of ${p.amount} ${p.currency} for order ${p.orderNumber} is ${p.status.toLowerCase().replace(/_/g, " ")}.`,
  });
}

export async function sendReviewSubmittedAlert(p: {
  name: string;
  email: string;
  productName: string;
  rating: number;
  body: string;
}) {
  return sendAdminNotificationEmail({
    name: p.name,
    email: p.email,
    subject: `Review awaiting moderation: ${p.productName}`,
    message: `Product: ${p.productName}\nRating: ${p.rating}/5\n\n${p.body}`,
  });
}
