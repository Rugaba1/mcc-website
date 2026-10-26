import Image from "next/image";
import type { ComponentProps } from "react";

type MediaImageProps = Omit<
  ComponentProps<typeof Image>,
  "src" | "alt"
> & {
  src: string;
  alt?: string;
};

export function MediaImage({
  src,
  alt = "",
  width,
  height,
  fill,
  sizes = "100vw",
  ...props
}: MediaImageProps) {
  const dimensions = fill
    ? { fill }
    : { width: width ?? 1200, height: height ?? 900 };

  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      {...dimensions}
      {...props}
    />
  );
}
