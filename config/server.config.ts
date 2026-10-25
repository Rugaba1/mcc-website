import "server-only";

export const serverConfig = {
  smtp: {
    host: process.env.EMAIL_HOST || "",
    port: Number(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
  },
  adminEmail: process.env.ADMIN_EMAIL?.trim() || "",
};
