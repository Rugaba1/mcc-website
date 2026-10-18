"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { Input, Label } from "./fields";
import apiClient from "../../lib/api-client";
import { Button } from "../ui/button";
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const { data } = await apiClient.post<{ url: string }>("/api/upload", fd, {

      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    });
    return data.url;
  } catch (e: any) {
    throw new Error(e?.response?.data?.error ?? "Upload failed");
  }
}

export function ImageUploader({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const isUrl = value.startsWith("/uploads/") || value.startsWith("http");

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <Button
          type="button"
          onClick={() => !uploading && ref.current?.click()}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted hover:border-primary"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-7 w-7 text-muted-foreground" />
          )}
        </Button>
        <div className="flex-1">
          <Input
            placeholder="Paste image URL…"
            value={isUrl ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button
            type="button"
            disabled={uploading}
            onClick={() => ref.current?.click()}
            className="mt-2 text-xs font-semibold text-primary hover:underline disabled:opacity-40"
          >
            {uploading ? "Uploading…" : "or upload from computer"}
          </Button>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          <Input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </div>
    </div>
  );
}