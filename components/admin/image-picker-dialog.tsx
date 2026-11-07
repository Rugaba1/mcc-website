"use client";

import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import type { MediaFile } from "@/lib/api";

export function ImagePickerDialog({
    open, onOpenChange, onSelect,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSelect: (file: MediaFile) => void;
}) {
    return (
        <MediaLibraryPicker open={open} onOpenChange={onOpenChange} onSelect={onSelect} kind="image" />
    );
}