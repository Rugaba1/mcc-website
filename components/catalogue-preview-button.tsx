"use client";

import type { ReactNode } from "react";

import { useMediaPreview, type MediaPreviewFile } from "@/components/media-preview-provider";

export function CataloguePreviewButton({
  file,
  children,
  className,
}: {
  file: MediaPreviewFile;
  children: ReactNode;
  className: string;
}) {
  const { openPreview } = useMediaPreview();

  return (
    <button
      type="button"
      className={className}
      onClick={() => openPreview(file)}
      aria-label={`Preview ${file.name}`}
    >
      {children}
    </button>
  );
}
