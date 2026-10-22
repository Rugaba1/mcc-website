import path from "node:path";

/** Brand tokens, mirrored from globals.css (light theme). */
export const BRAND = {
  gold: "#d6b43e", // --primary (Olive Ocher): accents only, low contrast as text on cream
  ink: "#00332e", // --primary-foreground: text on gold
  green: "#004f46", // --accent (Dusky Green): table header, titles
  success: "#437742", // --success (Cossack Green)
  text: "#1a2b27", // --foreground
  muted: "#5f6b63", // --muted-foreground
  cream: "#fdf1dc", // --secondary
  surface: "#f6f0e0", // --muted
  border: "#eadfb8", // --border
  danger: "#c9432f", // --destructive
  white: "#ffffff",
} as const;

const fontPath = (...p: string[]) =>
  path.join(process.cwd(), "public", "fonts", ...p);
const CG = fontPath("century", "centurygothic.ttf");
const CGB = fontPath("century", "centurygothic_bold.ttf");
const GL = fontPath("glovar", "glovar.otf");

/** Same files as your next/font setup. Body = Century Gothic, headings = Glovar. */
export const FONT_FILES = {
  CenturyGothic: { normal: CG, bold: CGB, italics: CG, bolditalics: CGB },
  Glovar: { normal: GL, bold: GL, italics: GL, bolditalics: GL },
};

export const COMPANY = {
  name: "Mountain Ceramic Company Limited",
  address: process.env.COMPANY_ADDRESS ?? "Kigali, Rwanda",
  tin: process.env.COMPANY_TIN ?? "",
  phone: process.env.COMPANY_PHONE ?? "",
  email: process.env.COMPANY_EMAIL ?? "",
  website: process.env.COMPANY_WEBSITE ?? "",
  /** Shown on proforma invoices, e.g. "MTN MoMo code 123456 · BK account ..." */
  paymentInstructions: process.env.INVOICE_PAYMENT_INSTRUCTIONS ?? "",
};

/** Private directory, must NOT be inside /public. Mount a persistent volume here in production. */
export const INVOICE_STORAGE_DIR = path.resolve(
  process.env.INVOICE_STORAGE_DIR ??
    path.join(process.cwd(), "storage", "invoices"),
);
