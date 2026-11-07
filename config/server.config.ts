import "server-only";

export const serverConfig = {
  resend: {
    apiKey: process.env.RESEND_API_KEY?.trim() || "",
  },
  adminEmail: process.env.ADMIN_EMAIL?.trim() || "",
};
