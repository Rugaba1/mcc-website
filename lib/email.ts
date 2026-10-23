import "server-only";
import { deliverMail } from "@/lib/mailer";

type SendMailOptions = Parameters<typeof deliverMail>[0];

const companyName =
  process.env.COMPANY_NAME ||
  process.env.NEXT_PUBLIC_APP_NAME ||
  "Mountain Ceramic Company LTD";
const adminEmail =
  process.env.ADMIN_EMAIL?.trim() || process.env.EMAIL_USER?.trim() || "";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const multiline = (s: string) => esc(s).replace(/\r?\n/g, "<br>");
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim(); // for subjects
const sender = () => process.env.EMAIL_FROM || process.env.EMAIL_USER || adminEmail;

const shell = (title: string, body: string) => `
  <div style="margin:0;background:#fffcf5;padding:24px 12px;color:#1a2b27;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;border:1px solid #eadfb8;background:#ffffff;">
      <div style="padding:22px 24px;background:#004f46;color:#ffffff;border-bottom:4px solid #d6b43e;">
        <p style="margin:0;color:#fdf1dc;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${esc(companyName)}</p>
        <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:24px;font-weight:700;">${title}</h1>
      </div>
      <div style="padding:24px;line-height:1.65;">${body}</div>
      <div style="padding:16px 24px;border-top:1px solid #eadfb8;color:#5f6b63;font-size:12px;">
        &copy; ${new Date().getFullYear()} ${esc(companyName)}
      </div>
    </div>
  </div>`;

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
       <p>If it is urgent, call us on +250 785 210 005.</p>`,
    ),
    text: `Hi ${p.firstName},\n\nWe received your message and will reply within 24 hours on business days.\n\nYour message:\n${p.message}`,
  });
}


async function safeSendMail(mailOptions: SendMailOptions) {
  if (!sender()) {
    console.warn("Email delivery skipped because EMAIL_FROM is not configured.");
    return false;
  }
  return deliverMail(mailOptions);
}

/** Alert to the internal inbox. Reply-To is the visitor, so "Reply" in your mail app works. */
export async function sendContactStaffAlert(p: {
  name: string;
  email: string;
  phone?: string | null;
  projectType?: string | null;
  message: string;
}) {
  if (!adminEmail) {
    console.warn("Staff email notification skipped because ADMIN_EMAIL is not configured.");
    return false;
  }
  return safeSendMail({
    from: sender(),
    to: adminEmail,
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
    replyTo: adminEmail || sender(),
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


export async function sendPasswordResetEmail(
  to: string,
  code: string,
  firstName: string,
) {
  const mailOptions = {
    from: sender(),
    to,
    subject: "Password Reset Request",
    html: shell(
      "Password reset code",
      `<p>Hi ${esc(firstName)},</p>
       <p>Use this code to reset your password:</p>
       <p style="padding:16px;border:1px solid #eadfb8;background:#fffcf5;color:#004f46;font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;">${esc(code)}</p>
       <p>This code expires in one hour. If you did not request a reset, you can ignore this email.</p>`,
    ),
    text: `Hi ${firstName},\n\nWe received a request to reset your password. Enter this code to continue:\n\n${code}\n\nThis code will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email or contact support if you have concerns.`,
  };

  const sent = await safeSendMail(mailOptions);
  if (!sent) {
    throw new Error("Failed to send password reset email");
  }

  return true;
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
  to = adminEmail,
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
  if (!adminEmail) {
    console.warn("Staff email notification skipped because ADMIN_EMAIL is not configured.");
    return false;
  }
  return safeSendMail({
    from: sender(),
    to,
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
  total: string;
}) {
  return sendCustomerNotificationEmail({
    to: p.to,
    firstName: p.firstName,
    subject: `Order ${oneLine(p.orderNumber)} received`,
    message: `We received your order ${p.orderNumber}.\n\nOrder total: ${p.total}\n\nWe’ll email you when its status changes.`,
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
