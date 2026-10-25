"use client";

import { X } from "lucide-react";
import { Button } from "../ui/button";

export function Modal({
  title,
  onClose,
  onSave,
  saving,
  saveDisabled,
  saveLabel = "Save",
  maxWidth = "max-w-xl",
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  saveDisabled?: boolean;
  saveLabel?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4 backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl bg-background shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-bold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || saveDisabled}>
            {saving ? "Saving…" : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}