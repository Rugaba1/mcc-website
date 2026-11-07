import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.siteName,
    short_name: "MCC",
    description: siteConfig.metadata.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: siteConfig.defaultLanguage,
    categories: ["business", "shopping"],
    theme_color: "#00574f",
    background_color: "#fffcf5",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
