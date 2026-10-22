"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileManager } from "@/components/admin/file-manager";
import type { MediaFile } from "@/lib/api";

export function ImagePickerDialog({
    open, onOpenChange, onSelect,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSelect: (file: MediaFile) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* FileManager is flex-1/min-h-0, so the dialog needs a fixed height */}
            <DialogContent className="flex h-[85vh] flex-col rounded-none sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Choose an image</DialogTitle>
                    <DialogDescription>Upload a new one or double-click an existing image.</DialogDescription>
                </DialogHeader>
                <FileManager
                    mode="pick"
                    kind="image"
                    onSelect={(f) => {
                        onSelect(f);
                        onOpenChange(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}