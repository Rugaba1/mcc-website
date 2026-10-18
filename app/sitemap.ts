import type { MetadataRoute } from "next";
import { siteConfig } from "../config/site.config";

const base = siteConfig.siteUrl.replace(/\/$/, "");
const locales = siteConfig.languages as string[];
const apiUrl = siteConfig.apiUrl;

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/tests", changeFrequency: "weekly", priority: 1.0 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "monthly", priority: 0.7 },
  { path: "/prayer", changeFrequency: "monthly", priority: 0.7 },
  { path: "/resources", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
];
 
async function safeFetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${apiUrl}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items ?? []);
  } catch {
    return [];
  }
}

function localizedEntries(
  section: string,
  id: string,
  dateStr: string | null | undefined,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${base}/${locale}/${section}/${id}`,
    lastModified: dateStr ? new Date(dateStr) : new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${base}/${l}/${section}/${id}`]),
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tests] = await Promise.all([safeFetchList<any>("/tests?limit=100")]);

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticRoutes.map(({ path, changeFrequency, priority }) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${base}/${l}${path}`]),
        ),
      },
    })),
  );

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...tests.flatMap((d) =>
      localizedEntries("devotionals", d.id, d.devotional_date, 0.6),
    ),
  ];

  return [...staticEntries, ...dynamicEntries];
}
