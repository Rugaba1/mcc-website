import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/admin", "/*/admin", "/account", "/*/account", "/cart", "/*/cart", "/checkout", "/*/checkout"],
    },
    sitemap: new URL("/sitemap.xml", siteConfig.siteUrl).toString(),
  };
}
