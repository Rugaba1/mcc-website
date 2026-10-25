import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { supportedLocales } from "@/lib/constants";

export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeCookie: true,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
