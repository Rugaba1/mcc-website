import { ChevronRight, Home } from "lucide-react";
import { headers } from "next/headers";
import { Link } from "@/app/i18n/routing";
import { localizedUrl } from "@/lib/alternates";
import { siteConfig } from "@/config/site.config";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export async function Breadcrumbs({ items }: BreadcrumbsProps) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const locale = requestHeaders.get("x-locale") ?? siteConfig.defaultLanguage;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href ? localizedUrl(locale, item.href) : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="breadcrumb" className="">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex flex-wrap items-center gap-0.5 text-xs">
            {items.map((item, i) => {
              const isLast = i === items.length - 1;
              return (
                <li key={i} className="flex items-center gap-0.5 min-w-0">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 mx-0.5" />
                  )}
                  {isLast || !item.href ? (
                    <span
                      className="font-semibold text-foreground truncate max-w-40 sm:max-w-xs"
                      aria-current={isLast ? "page" : undefined}
                    >
                      {i === 0 && <Home className="h-3 w-3 inline -mt-0.5 mr-1 shrink-0" />}
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href as "/"}
                      className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {i === 0 && <Home className="h-3 w-3 shrink-0" />}
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
