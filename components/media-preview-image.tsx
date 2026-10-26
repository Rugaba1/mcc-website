"use client";

import Image from "next/image";

import { useMediaPreview } from "@/components/media-preview-provider";

export function MediaPreviewImage({
  src,
  alt = "",
}: {
  src?: string;
  alt?: string;
}) {
  const { openPreview } = useMediaPreview();
  if (!src) return null;

  return (
    <button
      type="button"
      className="my-8 block w-full cursor-zoom-in text-left"
      aria-label={`Preview ${alt || "content image"}`}
      onClick={() =>
        openPreview({
          url: src,
          name: alt || "Content image",
          mimeType: "image/*",
        })
      }
    >
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={675}
        sizes="100vw"
        className="h-auto w-full border"
      />
    </button>
  );
}
