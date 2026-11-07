"use client";

import type { ReactNode } from "react";
import { MediaImage } from "@/components/media-image";

import { useMediaPreview } from "@/components/media-preview-provider";

export function MediaPreviewImage({
  src,
  alt = "",
  className = "",
  caption,
}: {
  src?: string;
  alt?: string;
  className?: string;
  caption?: ReactNode;
}) {
  const { openPreview } = useMediaPreview();
  if (!src) return null;

  const image = (
    <MediaImage
      src={src}
      alt={alt}
      width={1200}
      height={675}
      sizes="100vw"
      className="h-auto w-full border"
    />
  );

  const button = (
    <button
      type="button"
      className={`block w-full cursor-zoom-in text-left ${className}`}
      aria-label={`Preview ${alt || "content image"}`}
      onClick={() =>
        openPreview({
          url: src,
          name: alt || "Content image",
          mimeType: "image/*",
        })
      }
    >
      {image}
    </button>
  );

  if (!caption) return button;

  return (
    <figure className="my-8">
      {button}
      <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
