import { supportedLocales } from "../lib/constants";

export const siteConfig = {
  siteName: process.env.NEXT_PUBLIC_APP_NAME || "Zyntro",
  siteUrl: process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:300",
  apiUrl: process.env.NEXT_API_URL,
  defaultLanguage: "en",
  languages: supportedLocales,
  siteLogo: `${process.env.BASE_PATH || ""}/images/logo.png`,
  googleAnalyticsId: "",
  metadata: {
    title: "Action Driving School - Learn to Drive Safely",
    description:
      "Action Driving School provides professional driving lessons and training to help you become a confident and safe driver.",
  },
  socialProfiles: {
    facebook: "https://facebook.com/profile.php?id=61592578953475",
    instagram: "https://www.instagram.com/globalgodspresencechurch",
    youtube: "https://www.youtube.com/@globalgodspresencechurch",
    tiktok: "https://www.tiktok.com/@globalgodspresencechurch",
    twitter: "https://x.com/ggpchurch",
  },
};
