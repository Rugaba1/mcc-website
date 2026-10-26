"use client";

import { useState } from "react";
import { FileText, ImageIcon, X } from "lucide-react";
import Image from "next/image";

import type { MediaFile } from "@/lib/api";
import { FileManager } from "@/components/admin/file-manager";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] flex-col gap-3 rounded-none sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Choose a file</DialogTitle>
          <DialogDescription>Upload something new or pick from your library.</DialogDescription>
        </DialogHeader>
        {open && (
          <FileManager
            mode="pick"
            kind={kind}
            onSelect={(f) => {
              onSelect(f);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Drop-in replacement for an "Image URL" input: preview + library picker + manual link. */
export function ImageField({
  value,
  onChange,
  kind = "image",
  placeholder = "…or paste an https:// link",
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "file";
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const { openPreview } = useMediaPreview();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden border bg-muted">
          {value && kind === "image" ? (
            <Image src={value} alt="" fill sizes="5rem" className="object-cover" />
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
      <Input className="rounded-none text-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <PermissionGate required={PERM.MEDIA_VIEW}>
        <FilePicker open={open} onOpenChange={setOpen} kind={kind} onSelect={(f) => onChange(f.url)} />
      </PermissionGate>
    </div>
  );
}
