import nodemailer from "nodemailer";

const companyName = process.env.COMPANY_NAME || "MCC";
const adminEmail =
  process.env.ADMIN_EMAIL ||
  process.env.EMAIL_FROM ||
  process.env.EMAIL_USER ||
  "admin@example.com";

const transporter =
  process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
    ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })
    : null;

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
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <h2 style="margin: 0 0 16px;">${title}</h2>
    <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee; line-height: 1.6;">${body}</div>
    <p style="font-size: 12px; color: #666; margin-top: 16px;">&copy; ${new Date().getFullYear()} ${esc(companyName)}</p>
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


async function safeSendMail(mailOptions: nodemailer.SendMailOptions) {
  if (!transporter) {
    console.warn("Email sending skipped because SMTP config is missing.");
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/** Alert to the internal inbox. Reply-To is the visitor, so "Reply" in your mail app works. */
export async function sendContactStaffAlert(p: {
  name: string;
  email: string;
  phone?: string | null;
  projectType?: string | null;
  message: string;
}) {
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
    replyTo: adminEmail,
    subject: `Re: your message to ${companyName}`,
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
  resetUrl: string,
  firstName: string,
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || adminEmail,
    to,
    subject: "Password Reset Request",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>We received a request to reset your password. Click the link below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
              </div>
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${firstName},\n\nWe received a request to reset your password. Use this link to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email or contact support if you have concerns.`,
  };

  const sent = await safeSendMail(mailOptions);
  if (!sent) {
    throw new Error("Failed to send password reset email");
  }

  return true;
}

export async function sendPasswordChangedEmail(to: string, firstName: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || adminEmail,
    to,
    subject: "Password Changed Successfully",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .alert { background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Password Changed</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>This email confirms that your password was successfully changed.</p>
              <div class="alert">
                <strong>⚠️ Didn't make this change?</strong>
                <p>If you didn't change your password, please contact our support team immediately and secure your account.</p>
              </div>
              <p>For your security, you've been logged out of all devices. Please login again with your new password.</p>
            </div>
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${firstName},\n\nThis email confirms that your password was successfully changed.\n\nIf you didn't change your password, please contact our support team immediately and secure your account.`,
  };

  await safeSendMail(mailOptions);
  return true;
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || adminEmail,
    to,
    subject: `Welcome to ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="background: #4F46E5; color: white; padding: 20px; text-align: center; margin: 0;">Welcome, ${firstName}!</h1>
        <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee;">
          <p>Thank you for creating an account with ${companyName}.</p>
          <p>Your customer account is now active and you can browse our tiles, save favourites, and start design reviews.</p>
          <p>If you need help, our team is always ready to assist.</p>
        </div>
      </div>
    `,
    text: `Welcome ${firstName}! Your account with ${companyName} is ready.`,
  };

  await safeSendMail(mailOptions);
  return true;
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
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || adminEmail,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin-bottom: 12px;">Hi ${firstName},</h2>
        <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee;">
          ${message}
        </div>
      </div>
    `,
    text: `Hi ${firstName},\n\n${message}`,
  };

  await safeSendMail(mailOptions);
  return true;
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
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || adminEmail,
    to,
    subject: `[${companyName}] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New customer notification</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #eee; white-space: pre-wrap;">${message}</div>
      </div>
    `,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
  };

  await safeSendMail(mailOptions);
  return true;
}
