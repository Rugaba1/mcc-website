"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, FileText, Loader2, Pencil, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type MediaFile } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { DataPagination } from "@/components/admin/data-pagination";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 24;
const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

type Kind = "all" | "image" | "file";

export function FileManager({
  mode = "manage",
  kind: fixedKind,
  onSelect,
}: {
  mode?: "manage" | "pick";
  kind?: Kind; // lock the list to images or documents (used by pickers)
  onSelect?: (file: MediaFile) => void;
}) {
  const [kind, setKind] = useState<Kind>(fixedKind ?? "all");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [renaming, setRenaming] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState<MediaFile | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setRefreshKey((k) => k + 1);
  useEffect(() => setPage(1), [q, kind]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getFiles({ q: q || undefined, kind: kind === "all" ? undefined : kind, page, limit: PAGE_SIZE })
      .then((r) => {
        if (cancelled) return;
        setFiles(r.files);
        setTotal(r.total);
        setTotalPages(r.totalPages);
      })
      .catch((e) => !cancelled && toast.error(apiErrorMessage(e, "Failed to load files")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, kind, page, refreshKey]);

  const upload = useCallback(
    async (list: FileList | File[] | null) => {
      const arr = list ? Array.from(list) : [];
      if (!arr.length) return;
      setProgress(0);
      try {
        const saved = await api.uploadFiles(arr, setProgress);
        toast.success(`${saved.length} file${saved.length === 1 ? "" : "s"} uploaded`);
        if (mode === "pick" && saved[0]) setSelected(saved[0]);
        setPage(1);
        refresh();
      } catch (e) {
        toast.error(apiErrorMessage(e, "Upload failed"));
      } finally {
        setProgress(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [mode],
  );

  const copy = async (f: MediaFile) => {
    await navigator.clipboard.writeText(`${window.location.origin}${f.url}`);
    toast.success("Link copied");
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteFile(deleting.id);
      toast.success("File deleted");
      if (selected?.id === deleting.id) setSelected(null);
      setDeleting(null);
      if (files.length === 1 && page > 1) setPage(page - 1);
      else refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not delete the file"));
    } finally {
      setBusy(false);
    }
  };

  const accept = fixedKind === "image" ? "image/*" : undefined;

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-4 ${dragging ? "outline-2 -outline-offset-2 outline-dashed outline-primary" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files);
      }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="rounded-none pl-8" placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!fixedKind && (
          <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <TabsList className="rounded-none">
              <TabsTrigger value="all" className="rounded-none">All</TabsTrigger>
              <TabsTrigger value="image" className="rounded-none">Images</TabsTrigger>
              <TabsTrigger value="file" className="rounded-none">Documents</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <div className="ml-auto">
          <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => upload(e.target.files)} />
          <Button className="rounded-none" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
            {progress !== null ? <Loader2 className="animate-spin" /> : <Upload />}
            {progress !== null ? `Uploading ${progress}%` : "Upload"}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && files.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading files…
          </p>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border border-dashed py-20 text-sm text-muted-foreground">
            <Upload className="size-7" />
            {q ? "No files match your search." : "Drop files here or use Upload."}
          </div>
        ) : (
          <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 ${loading ? "opacity-60" : ""}`}>
            {files.map((f) => {
              const active = selected?.id === f.id;
              return (
                <div key={f.id} className={`group flex flex-col border bg-card ${active ? "ring-2 ring-primary" : ""}`}>
                  <button
                    type="button"
                    className="relative aspect-square overflow-hidden bg-muted"
                    onClick={() => mode === "pick" && setSelected(f)}
                    onDoubleClick={() => mode === "pick" && onSelect?.(f)}
                  >
                    {f.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt={f.alt ?? f.name} loading="lazy" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                        <FileText className="size-8" />
                        <span className="text-xs uppercase">{f.url.split(".").pop()}</span>
                      </span>
                    )}
                    {active && (
                      <span className="absolute right-1.5 top-1.5 bg-primary p-0.5 text-primary-foreground">
                        <Check className="size-4" />
                      </span>
                    )}
                  </button>
                  <div className="space-y-1 p-2">
                    <p className="truncate text-sm font-medium" title={f.name}>{f.name}</p>
                    <p className="text-xs text-muted-foreground">{size(f.size)}</p>
                    <div className="flex gap-0.5">
                      <Button type="button" variant="ghost" size="icon" className="size-7 rounded-none" onClick={() => copy(f)} aria-label="Copy link"><Copy /></Button>
                      <Button type="button" variant="ghost" size="icon" className="size-7 rounded-none" onClick={() => setRenaming(f)} aria-label="Rename"><Pencil /></Button>
                      <Button type="button" variant="ghost" size="icon" className="size-7 rounded-none text-destructive hover:text-destructive" onClick={() => setDeleting(f)} aria-label="Delete"><Trash2 /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border">
        <DataPagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} />
      </div>

      {mode === "pick" && (
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <p className="min-w-0 truncate text-sm text-muted-foreground">{selected ? selected.name : "Select a file (double-click to use it)"}</p>
          <Button className="rounded-none" disabled={!selected} onClick={() => selected && onSelect?.(selected)}>
            Use selected file
          </Button>
        </div>
      )}

      <RenameDialog file={renaming} onClose={() => setRenaming(null)} onSaved={refresh} />
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this file?"
        description="The file is removed from the server. Any product or page still using its link will show a broken file."
        busy={busy}
        onConfirm={remove}
      />
    </div>
  );
}

function RenameDialog({ file, onClose, onSaved }: { file: MediaFile | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(file?.name ?? "");
    setAlt(file?.alt ?? "");
  }, [file]);

  const save = async () => {
    if (!file || !name.trim()) return;
    setSaving(true);
    try {
      await api.renameFile(file.id, { name: name.trim(), alt: alt.trim() || null });
      toast.success("File updated");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the file"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader><DialogTitle>Rename file</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Name</Label><Input className="rounded-none" value={name} onChange={(e) => setName(e.target.value)} /></div>
          {file?.kind === "image" && (
            <div className="space-y-1.5"><Label>Alt text</Label><Input className="rounded-none" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" /></div>
          )}
          <p className="break-all text-xs text-muted-foreground">{file?.url}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="rounded-none" onClick={save} disabled={saving || !name.trim()}>{saving && <Loader2 className="animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
