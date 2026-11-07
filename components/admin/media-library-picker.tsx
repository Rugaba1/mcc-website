"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type MediaFile, type MediaFolder } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/contexts/auth-context";
import { hasPermissions } from "@/lib/permissions/core";
import { PERM } from "@/lib/permissions/catalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaImage } from "@/components/media-image";
import { useMediaPreview } from "@/components/media-preview-provider";
import { DataPagination } from "@/components/admin/data-pagination";

type PickerKind = "all" | "image" | "file";
const PAGE_SIZE = 24;

export function MediaLibraryPicker({
  open,
  onOpenChange,
  onSelect,
  kind = "all",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: MediaFile) => void;
  kind?: PickerKind;
}) {
  const { user } = useAuth();
  const { openPreview } = useMediaPreview();
  const canUpload = Boolean(user && hasPermissions(user.permissions, PERM.MEDIA_UPLOAD));
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [folderFilter, setFolderFilter] = useState("all");
  const [activeKind, setActiveKind] = useState<PickerKind>(kind);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setSelected(null);
    setQuery("");
    setFolderFilter("all");
    setActiveKind(kind);
  }, [open, kind]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const folderId =
      folderFilter === "all"
        ? undefined
        : folderFilter === "root"
          ? "root" as const
          : Number(folderFilter);
    api.getFiles({
      q: debouncedQuery.trim() || undefined,
      kind: activeKind === "all" ? undefined : activeKind,
      folderId,
      page,
      limit: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setFiles(result.files);
      setFolders(result.folders);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    }).catch((error: unknown) => {
      if (!cancelled) toast.error(apiErrorMessage(error, "Could not load the media library"));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery, activeKind, folderFilter, page, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, activeKind, folderFilter]);

  const upload = async (list: FileList | null) => {
    const selectedFiles = list ? Array.from(list) : [];
    if (!selectedFiles.length || !canUpload) return;
    const folderId =
      folderFilter !== "all" && folderFilter !== "root"
        ? Number(folderFilter)
        : null;
    setUploading(true);
    try {
      const saved = await api.uploadFiles(selectedFiles, {
        folderId,
        isPublic: true,
      });
      if (saved[0]) setSelected(saved[0]);
      setRefreshKey((key) => key + 1);
      setPage(1);
      toast.success(`${saved.length} file${saved.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Upload failed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const confirmSelection = () => {
    if (!selected) return;
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex h-[min(90dvh,800px)] w-[calc(100%-1rem)] flex-col gap-4 overflow-hidden rounded-none p-3 sm:w-[calc(100%-2rem)] sm:max-w-5xl sm:p-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 size-11 rounded-none"
          onClick={() => onOpenChange(false)}
          aria-label="Close file picker"
        >
          <X aria-hidden="true" />
        </Button>
        <DialogHeader className="shrink-0 pr-14 text-left">
          <DialogTitle>
            {kind === "image" ? "Choose an image" : kind === "file" ? "Choose a file" : "Choose media"}
          </DialogTitle>
          <DialogDescription>
            Search, filter by folder, preview, and select an item from your media library.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                aria-label="Search media library"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by file name"
                className="rounded-none pl-10"
              />
            </div>
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger aria-label="Filter media by folder" className="w-full rounded-none sm:w-56">
                <SelectValue placeholder="All folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All folders</SelectItem>
                <SelectItem value="root">Unfiled</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={String(folder.id)}>
                    {folder.name} ({folder.fileCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {kind === "all" && (
            <Tabs value={activeKind} onValueChange={(value) => setActiveKind(value as PickerKind)}>
              <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none">
                <TabsTrigger value="all" className="min-h-11 rounded-none">All files</TabsTrigger>
                <TabsTrigger value="image" className="min-h-11 rounded-none">Images</TabsTrigger>
                <TabsTrigger value="file" className="min-h-11 rounded-none">Documents</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto" aria-busy={loading}>
          {loading && files.length === 0 ? (
            <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" /> Loading files…
            </p>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border border-dashed px-4 py-12 text-center">
              <FileText aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {query.trim() ? "No files match your search." : "This folder is empty."}
              </p>
              {canUpload && (
                <Button type="button" variant="outline" className="min-h-11 rounded-none" onClick={() => inputRef.current?.click()} disabled={uploading}>
                  <Upload aria-hidden="true" />
                  Upload new files
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {files.map((file) => {
                const active = selected?.id === file.id;
                return (
                  <article key={file.id} className={`min-w-0 border bg-card ${active ? "border-primary ring-2 ring-primary" : ""}`}>
                    <button
                      type="button"
                      aria-pressed={active}
                      aria-label={`${active ? "Selected" : "Select"} ${file.name}`}
                      onClick={() => setSelected(file)}
                      className="flex min-h-11 w-full flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-muted">
                        {file.kind === "image" && file.isPublic ? (
                          <MediaImage src={file.url} alt="" fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" />
                        ) : (
                          <span className="flex flex-col items-center gap-2 px-2 text-center text-muted-foreground">
                            <FileText aria-hidden="true" className="size-8" />
                            <span className="text-xs">{file.isPublic ? "Document" : "Private file"}</span>
                          </span>
                        )}
                        {active && <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground" aria-hidden="true">✓</span>}
                      </span>
                      <span className="w-full truncate px-2 pt-2 text-sm font-medium">{file.name}</span>
                      <span className="w-full px-2 pb-2 text-xs text-muted-foreground">
                        {file.folder?.name ?? "Unfiled"} · {file.isPublic ? "Public" : "Private"}
                      </span>
                    </button>
                    <div className="border-t p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 w-full rounded-none"
                        onClick={() => openPreview({
                          id: file.id,
                          isPublic: file.isPublic,
                          url: file.url,
                          name: file.name,
                          mimeType: file.mimeType,
                        })}
                        aria-label={`Preview ${file.name}`}
                      >
                        Preview
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {canUpload && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={kind === "image" ? "image/*" : undefined}
                  className="hidden"
                  onChange={(event) => void upload(event.target.files)}
                />
                <Button type="button" variant="outline" className="min-h-11 rounded-none" onClick={() => inputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Upload aria-hidden="true" />}
                  {uploading ? "Uploading…" : "Upload files"}
                </Button>
              </>
            )}
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {selected ? `Selected: ${selected.name}${selected.isPublic ? "" : " (private)"}` : `${total} ${total === 1 ? "file" : "files"}`}
            </span>
            {selected?.isPublic === false && (
              <span className="text-xs text-amber-800 dark:text-amber-300">
                Private files are not visible on public pages.
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="min-h-11 rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" className="min-h-11 rounded-none" disabled={!selected} onClick={confirmSelection}>
              Use selected file
            </Button>
          </div>
        </div>
        {totalPages > 1 && (
          <DataPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            disabled={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
