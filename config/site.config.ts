const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_DOMAIN;

function getOrigin(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? [url.origin]
      : [];
  } catch {
    return [];
  }
}

const imageOrigins = (process.env.NEXT_PUBLIC_IMAGE_DOMAINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)
  .flatMap((value) => getOrigin(value.includes("://") ? value : `https://${value}`));

const allowedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_DOMAIN,
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.NEXT_API_URL,
].flatMap(getOrigin);
const companyStreetAddress =
  process.env.NEXT_PUBLIC_COMPANY_STREET_ADDRESS ||
  process.env.COMPANY_STREET_ADDRESS ||
  "Kacyiru";
const companyLocality =
  process.env.NEXT_PUBLIC_COMPANY_LOCALITY ||
  process.env.COMPANY_LOCALITY ||
  "Gasabo";
const companyRegion =
  process.env.NEXT_PUBLIC_COMPANY_REGION ||
  process.env.COMPANY_REGION ||
  "Umujyi wa Kigali";
const companyCountry =
  process.env.NEXT_PUBLIC_COMPANY_COUNTRY ||
  process.env.COMPANY_COUNTRY ||
  "RWANDA";
const companyName =
  process.env.NEXT_PUBLIC_APP_NAME ||
  process.env.NEXT_PUBLIC_COMPANY_NAME ||
  process.env.COMPANY_NAME ||
  "Mountain Ceramic Company LTD";
const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() || "";

if (googleAnalyticsId && !/^G-[A-Z0-9]+$/i.test(googleAnalyticsId)) {
  throw new Error("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID must be a valid GA4 measurement ID.");
}

export const siteConfig = {
  siteName: process.env.NEXT_PUBLIC_APP_NAME || "Mountain Ceramic Company LTD",
  companyName,
  companyStreetAddress,
  companyLocality,
  companyRegion,
  companyCountry,
  companyAddress:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
    process.env.COMPANY_ADDRESS ||
    [
      companyStreetAddress,
      companyLocality,
      companyRegion,
      companyCountry,
    ].join(", "),
  companyTin: process.env.COMPANY_TIN || "108383570",
  companyRegistrationNumber: process.env.COMPANY_REGISTRATION_NUMBER || "",
  companyPhone:
    process.env.NEXT_PUBLIC_COMPANY_PHONE ||
    process.env.COMPANY_PHONE ||
    "+250788304033",
  companyPhoneAlternate:
    process.env.NEXT_PUBLIC_COMPANY_PHONE_ALTERNATE ||
    process.env.COMPANY_PHONE_ALTERNATE ||
    "+250 780 765 548",
  companyEmail:
    process.env.NEXT_PUBLIC_COMPANY_EMAIL ||
    process.env.COMPANY_EMAIL ||
    "info@mountainceramic.com",
  companySalesEmail:
    process.env.NEXT_PUBLIC_COMPANY_SALES_EMAIL ||
    process.env.COMPANY_SALES_EMAIL ||
    "sales@mountainceramic.com",
  companyBankName:
    process.env.NEXT_PUBLIC_COMPANY_BANK_NAME ||
    process.env.COMPANY_BANK_NAME ||
    "Bank of Kigali",
  companyBankAccountName:
    process.env.NEXT_PUBLIC_COMPANY_BANK_ACCOUNT_NAME ||
    process.env.COMPANY_BANK_ACCOUNT_NAME ||
    companyName,
  companyBankAccountNumber:
    process.env.NEXT_PUBLIC_COMPANY_BANK_ACCOUNT_NUMBER ||
    process.env.COMPANY_BANK_ACCOUNT_NUMBER ||
    "100024581661",
  companyWebsite:
    process.env.NEXT_PUBLIC_COMPANY_WEBSITE ||
    process.env.COMPANY_WEBSITE ||
    configuredSiteUrl ||
    "",
  invoicePaymentInstructions:
    process.env.NEXT_PUBLIC_INVOICE_PAYMENT_INSTRUCTIONS ||
    process.env.INVOICE_PAYMENT_INSTRUCTIONS ||
    "",
  emailFrom: process.env.EMAIL_FROM?.trim() || "",
  emailReplyTo: process.env.EMAIL_REPLY_TO?.trim() || "",
  configuredSiteUrl,
  siteUrl: configuredSiteUrl || "http://localhost:3000",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_DOMAIN ||
    configuredSiteUrl ||
    "http://localhost:3000",
  apiUrl: process.env.NEXT_API_URL,
  publicApiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  cdnUrl: process.env.NEXT_CDN_DOMAIN,
  websocketUrl: process.env.NEXT_WS_ORIGIN,
  isProduction: process.env.NODE_ENV === "production",
  allowedOrigins: [...new Set(allowedOrigins)],
  imageOrigins,
  defaultLanguage: "en",
  languages: ["en", "fr", "rw"] as const,
  defaultCurrency: "RWF",
  defaultTimeZone: "Africa/Kigali",
  siteLogo: `${process.env.BASE_PATH || ""}/images/logo.png`,
  googleAnalyticsId,
  jwtIssuer: process.env.NEXT_PUBLIC_APP_NAME || "mountain-ceramics",
  metadata: {
    title: "Mountain Ceramics Company | Tile Manufacturer in Rwanda",
    description:
      "Mountain Ceramics Company manufactures ceramic and porcelain tiles in Rwanda for residential, commercial, and industrial projects.",
  },
};
