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
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
