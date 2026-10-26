"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { routing } from "@/app/i18n/routing";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ShareWidget({
  title,
  text,
  path,
  label = "Share",
  iconOnly = false,
}: {
  title: string;
  text?: string;
  path: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setSupportsNativeShare("share" in navigator);
  }, []);

  const defaultLocalePrefix = `/${routing.defaultLocale}/`;
  const normalizedPath = path.startsWith(defaultLocalePrefix)
    ? path.slice(routing.defaultLocale.length + 1)
    : path;
  const alreadyLocalized = routing.locales.some(
    (supportedLocale) =>
      supportedLocale !== routing.defaultLocale &&
      (normalizedPath === `/${supportedLocale}` ||
        normalizedPath.startsWith(`/${supportedLocale}/`)),
  );
  const localizedPath =
    locale === routing.defaultLocale || alreadyLocalized
      ? normalizedPath
      : `/${locale}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
  const getUrl = () => new URL(localizedPath, window.location.origin).toString();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Could not copy share link:", error);
      toast.error("Could not copy the link");
    }
  };

  const shareNative = async () => {
    if (!supportsNativeShare) return;
    try {
      await navigator.share({ title, text, url: getUrl() });
      setOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Native sharing failed:", error);
      toast.error("Could not share this content");
    }
  };

  const encodedUrl = encodeURIComponent(
    origin ? new URL(localizedPath, origin).toString() : localizedPath,
  );
  const encodedText = encodeURIComponent(text || title);
  const links = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A${encodedUrl}`,
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={iconOnly ? "icon" : "default"}
          className={iconOnly ? "size-8 rounded-none" : "rounded-none"}
          aria-label={`Share ${title}`}
          title={`Share ${title}`}
        >
          <Share2 />
          {!iconOnly && label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 rounded-none">
        <p className="mb-3 truncate text-sm font-medium">{title}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="col-span-2 rounded-none"
            disabled={!supportsNativeShare}
            onClick={() => void shareNative()}
          >
            <Share2 />
            Share…
          </Button>
          <Button
            type="button"
            variant="outline"
            className="col-span-2 rounded-none"
            onClick={() => void copyLink()}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target={link.name === "Email" ? undefined : "_blank"}
              rel={link.name === "Email" ? undefined : "noopener noreferrer"}
              className="inline-flex min-h-9 items-center justify-center border px-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {link.name}
            </a>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
