import { Link } from "@/app/i18n/routing";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  basePath: "/products" | "/catalogue";
  prevLabel: string;
  nextLabel: string;
  pageLabel: string;

  extraQuery?: Record<string, string>;
}

export function PaginationControls({ page, totalPages, basePath, prevLabel, nextLabel, pageLabel, extraQuery = {} }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const query = { ...extraQuery, ...(p >= 1 ? { page: String(p) } : {}) };
    return Object.keys(query).length > 0 ? { pathname: basePath, query } : { pathname: basePath };
  };

  return (
    <div className="flex items-center justify-center gap-3 h-6 pt-8">
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className={`inline-flex items-center gap-1   border px-3 py-2 text-sm font-medium transition-colors ${page <= 1
          ? "pointer-events-none opacity-40 border-border text-muted-foreground"
          : "border-border hover:border-primary/50 hover:text-primary"
          }`}
      >
        <ChevronLeft className="h-4 w-4" /> {prevLabel}
      </Link>
      <span className="text-sm text-muted-foreground">{pageLabel}</span>
      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        className={`inline-flex items-center gap-1   border px-3 py-2 text-sm font-medium transition-colors ${page >= totalPages
          ? "pointer-events-none opacity-40 border-border text-muted-foreground"
          : "border-border hover:border-primary/50 hover:text-primary"
          }`}
      >
        {nextLabel} <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
