import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...(config.plugins || []), new PrismaPlugin()];
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
   compiler: {
      removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },
   turbopack: {},
  images: {
    // Allow optimized images from Unsplash
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    // Allow locally uploaded images from public/uploads/
    // and all other local static files (logo, icons, etc.)
    localPatterns: [{ pathname: "/**" }],
  },
};

export default nextConfig;
