/** @type {import('next').NextConfig} */
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

const imageSources = (process.env.NEXT_PUBLIC_IMAGE_DOMAINS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);
const imagePatterns = [...new Set([...imageSources, "https://images.unsplash.com"])].map((source) => {
  const url = new URL(source.includes("://") ? source : `https://${source}`);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Unsupported image source protocol: ${url.protocol}`);
  }
  return {
    protocol: url.protocol.slice(0, -1),
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
  };
});
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...(config.plugins || []), new PrismaPlugin()];
    }
    return config;
  },
  serverExternalPackages: ["pdfmake"],
  outputFileTracingIncludes: {
    "/api/auth/**/*": [
      "./disposable_domains.txt",
      "./disposable_mx.txt",
    ],
  },

  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  images: {
    remotePatterns: imagePatterns,
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Signal",
            value: "ai-train=yes, search=yes, ai-input=yes",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },

      {
        source: "/api/invoices/:path*",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        source: "/uploads/:path*",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
