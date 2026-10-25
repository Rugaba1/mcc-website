import { siteConfig } from "@/config/site.config";

export const COMPANY = {
  name: "Mountain Ceramics Company",
  shortName: "MCC",
  country: "RW",
} as const;

// Locales
export const localesConfig = [
  { code: "en" as const, label: "English" },
  { code: "fr" as const, label: "Français" },
  { code: "rw" as const, label: "Kinyarwanda" },
];
export const supportedLocales = siteConfig.languages;
export const defaultLocale = siteConfig.defaultLanguage;
export const EXPLICIT_LOCALE_PREFIX = /^\/(en|rw|fr)(\/|$)/;

// Commerce
export const DEFAULT_CURRENCY = siteConfig.defaultCurrency;
export const VAT_RATE = 0.18; // Rwanda standard VAT

// Time
export const IS_PROD = siteConfig.isProduction;
export const DAY = 60 * 60 * 24;
export const WEEK = DAY * 7;

// Origins
export const CDN = siteConfig.cdnUrl; // tile images, visualizer textures
export const GCS = "https://storage.googleapis.com";
export const API_ORIGIN = siteConfig.apiUrl;
export const WS_ORIGIN = siteConfig.websocketUrl;

export const CLOUDFLARE_CHALLENGES = "https://challenges.cloudflare.com"; // Turnstile
export const YOUTUBE_NOCOOKIE = "https://www.youtube-nocookie.com"; // product / install videos

// Payments (Flutterwave covers MTN MoMo, Airtel Money and cards in Rwanda)
export const FLUTTERWAVE = [
  "https://checkout.flutterwave.com",
  "https://checkout-v3.flutterwave.com",
];

// CSP allow-lists
export const SCRIPT_HOSTS = [
  "https://checkout.flutterwave.com",
  CLOUDFLARE_CHALLENGES,
  "https://static.cloudflareinsights.com",
  ...(siteConfig.googleAnalyticsId ? ["https://www.googletagmanager.com"] : []),
];

export const IMG_HOSTS = [
  GCS,
  CDN,
  ...siteConfig.imageOrigins,
  "https://images.unsplash.com",
  "https://checkout.flutterwave.com",
  "https://i.ytimg.com",
  "https://*.tile.openstreetmap.org", // showroom map, if used
  ...(siteConfig.googleAnalyticsId ? ["https://*.google-analytics.com"] : []),
];

export const CONNECT_HOSTS = [
  "https://api.flutterwave.com",
  "https://checkout.flutterwave.com",
  CDN, // fetch() for visualizer textures
  GCS,
  CLOUDFLARE_CHALLENGES,
  "https://cloudflareinsights.com",
  ...(siteConfig.googleAnalyticsId
    ? ["https://*.google-analytics.com", "https://*.googletagmanager.com"]
    : []),
];

export const FRAME_HOSTS = [
  ...FLUTTERWAVE,
  CLOUDFLARE_CHALLENGES,
  YOUTUBE_NOCOOKIE,
  "https://www.google.com", // Google Maps embed for showroom/factory location
];

// Routing
// Everything is public EXCEPT these prefixes (matched after the locale is stripped).
export const protectedRoutes = ["/account", "/orders", "/wishlist"];
export const adminRoutes = ["/admin", "/portal"];
export const loginPath = "/login";

// Roles (keep IDs in sync with your DB seed)
export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  INVENTORY_MANAGER: 3,
  SALES_STAFF: 4,
  CONTENT_MANAGER: 5,
  SUPPORT_STAFF: 6,
  CONTRACTOR: 7,  
  CUSTOMER: 8,
  GUEST: 9,
} as const;

export const STAFF_ROLES = [
  ROLE_IDS.SUPER_ADMIN,
  ROLE_IDS.ADMIN,
  ROLE_IDS.INVENTORY_MANAGER,
  ROLE_IDS.SALES_STAFF,
  ROLE_IDS.CONTENT_MANAGER,
  ROLE_IDS.SUPPORT_STAFF,
];
export const publicRoutes = [
  "/",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
];