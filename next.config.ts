import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    localPatterns: [
      { pathname: "/**" },
    ],
  },
};

export default nextConfig;
