"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function pageList(page: number, totalPages: number): (number | "…")[] {
  const set = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function DataPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-8 rounded-none" disabled={disabled || page <= 1} onClick={() => onPageChange(1)} aria-label="First page">
          <ChevronsLeft />
        </Button>
        <Button variant="outline" size="icon" className="size-8 rounded-none" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className="size-8 rounded-none"
              disabled={disabled}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          ),
        )}
        <Button variant="outline" size="icon" className="size-8 rounded-none" disabled={disabled || page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
        <Button variant="outline" size="icon" className="size-8 rounded-none" disabled={disabled || page >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Last page">
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}