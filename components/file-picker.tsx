"use client";

import { useState } from "react";
import { FileText, ImageIcon, X } from "lucide-react";
import { MediaImage } from "@/components/media-image";

import type { MediaFile } from "@/lib/api";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { useMediaPreview } from "@/components/media-preview-provider";

/** Modal that lets the admin upload or pick a file from the library. */
export function FilePicker({
  open,
  onOpenChange,
  onSelect,
  kind = "image",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: MediaFile) => void;
  kind?: "all" | "image" | "file";
}) {
  return (
    <MediaLibraryPicker open={open} onOpenChange={onOpenChange} onSelect={onSelect} kind={kind} />
  );
}

/** Drop-in replacement for an "Image URL" input: preview + library picker + manual link. */
export function ImageField({
  value,
  onChange,
  kind = "image",
  placeholder = "…or paste an https:// link",
  ariaLabel = "Image or file URL",
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "file";
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const { openPreview } = useMediaPreview();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden border bg-muted">
          {value && kind === "image" ? (
            <MediaImage src={value} alt="" fill sizes="5rem" className="object-cover" />
          ) : value ? (
            <FileText className="size-6 text-muted-foreground" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {value && (
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={() =>
                openPreview({
                  url: value,
                  name: value.split("/").pop() || "Selected media",
                  mimeType: kind === "image" ? "image/*" : undefined,
                })
              }
            >
              Preview
            </Button>
          )}
          <PermissionGate required={PERM.MEDIA_VIEW}>
            <Button type="button" variant="outline" className="rounded-none" onClick={() => setOpen(true)}>
              {value ? "Replace" : "Choose from library"}
            </Button>
          </PermissionGate>
          {value && (
            <Button type="button" variant="ghost" className="rounded-none" onClick={() => onChange("")}>
              <X /> Remove
            </Button>
          )}
        </div>
      </div>
      <Input aria-label={ariaLabel} className="rounded-none text-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <PermissionGate required={PERM.MEDIA_VIEW}>
        <FilePicker open={open} onOpenChange={setOpen} kind={kind} onSelect={(f) => onChange(f.url)} />
      </PermissionGate>
    </div>
  );
}
