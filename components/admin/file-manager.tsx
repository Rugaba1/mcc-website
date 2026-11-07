"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Copy, Ellipsis, Eye, FileText, Loader2, Pencil, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";

import { api, apiErrorMessage, type MediaFile } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { DataPagination } from "@/components/admin/data-pagination";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { hasPermissions } from "@/lib/permissions/core";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaImage } from "@/components/media-image";
import { useMediaPreview } from "@/components/media-preview-provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 24;
const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const contextMenuItemClass =
  "relative flex min-h-11 cursor-default select-none items-center gap-2 px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4";

type Kind = "all" | "image" | "file";

/* eslint-disable jsx-a11y/no-static-element-interactions -- Drag-and-drop supplements the keyboard-accessible Upload button. */
export function FileManager({
  kind: fixedKind,
}: {
  kind?: Kind;
}) {
  const { user } = useAuth();
  const { openPreview } = useMediaPreview();
  const canUpload = Boolean(user && hasPermissions(user.permissions, PERM.MEDIA_UPLOAD));
  const canManageMedia = Boolean(user && hasPermissions(user.permissions, PERM.MEDIA_MANAGE));
  const canDeleteMedia = Boolean(user && hasPermissions(user.permissions, PERM.MEDIA_DELETE));
  const [kind, setKind] = useState<Kind>(fixedKind ?? "all");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search);
  const [folderFilter, setFolderFilter] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploadIsPublic, setUploadIsPublic] = useState(true);
  const [page, setPage] = useState(1);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<{ id: number; name: string; fileCount: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [renaming, setRenaming] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState<MediaFile | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setRefreshKey((k) => k + 1);
  useEffect(() => setPage(1), [q, kind, folderFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const folderId =
      folderFilter === "all"
        ? undefined
        : folderFilter === "root"
          ? "root" as const
          : Number(folderFilter);
    api
      .getFiles({
        q: q || undefined,
        kind: kind === "all" ? undefined : kind,
        folderId,
        page,
        limit: PAGE_SIZE,
      })
      .then((r) => {
        if (cancelled) return;
        setFiles(r.files);
        setFolders(r.folders);
        setTotal(r.total);
        setTotalPages(r.totalPages);
      })
      .catch((e) => !cancelled && toast.error(apiErrorMessage(e, "Failed to load files")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, kind, folderFilter, page, refreshKey]);

  const createFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name || creatingFolder) return;
    setCreatingFolder(true);
    try {
      const folder = await api.createMediaFolder(name);
      setFolders((current) =>
        [...current, folder].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setFolderFilter(String(folder.id));
      setNewFolderName("");
      toast.success(`Folder “${folder.name}” created`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not create folder"));
    } finally {
      setCreatingFolder(false);
    }
  };

  const deleteEmptyFolder = async () => {
    const folder = folders.find((item) => String(item.id) === folderFilter);
    if (!folder || folder.fileCount > 0) return;
    try {
      await api.deleteMediaFolder(folder.id);
      setFolders((current) => current.filter((item) => item.id !== folder.id));
      setFolderFilter("all");
      toast.success(`Folder “${folder.name}” deleted`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not delete folder"));
    }
  };

  const updateFile = async (
    file: MediaFile,
    change: { folderId?: number | null; isPublic?: boolean },
  ) => {
    try {
      await api.renameFile(file.id, change);
      if (change.folderId !== undefined && change.folderId !== file.folderId) {
        setFiles((current) => current.filter((item) => item.id !== file.id));
      } else {
        setFiles((current) =>
          current.map((item) =>
            item.id === file.id
              ? {
                  ...item,
                  ...change,
                  folder:
                    change.folderId === null
                      ? null
                      : folders.find((folder) => folder.id === change.folderId) ?? item.folder,
                }
              : item,
          ),
        );
      }
      toast.success(change.isPublic === undefined ? "File moved" : change.isPublic ? "File is public" : "File is private");
      refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update file"));
    }
  };

  const upload = useCallback(
    async (list: FileList | File[] | null) => {
      if (!canUpload) return;
      const arr = list ? Array.from(list) : [];
      if (!arr.length) return;
      setProgress(0);
      try {
        const folderId =
          folderFilter !== "all" && folderFilter !== "root"
            ? Number(folderFilter)
            : null;
        const saved = await api.uploadFiles(arr, {
          folderId,
          isPublic: canManageMedia ? uploadIsPublic : true,
          onProgress: setProgress,
        });
        toast.success(`${saved.length} file${saved.length === 1 ? "" : "s"} uploaded`);
        setPage(1);
        refresh();
      } catch (e) {
        toast.error(apiErrorMessage(e, "Upload failed"));
      } finally {
        setProgress(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [canManageMedia, canUpload, folderFilter, uploadIsPublic],
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input aria-label="Search files" className="rounded-none pl-8" placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-none">
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger aria-label="Filter by folder" className="min-w-40 rounded-none">
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
          {canManageMedia && folderFilter !== "all" && folderFilter !== "root" &&
            folders.find((folder) => String(folder.id) === folderFilter)?.fileCount === 0 && (
              <Button type="button" variant="outline" className="rounded-none" onClick={() => void deleteEmptyFolder()}>
                Delete empty folder
              </Button>
          )}
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
        <PermissionGate required={PERM.MEDIA_UPLOAD}>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {canManageMedia && (
              <Select value={uploadIsPublic ? "public" : "private"} onValueChange={(value) => setUploadIsPublic(value === "public")}>
                <SelectTrigger aria-label="New upload visibility" className="w-36 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            )}
            <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => upload(e.target.files)} />
            <Button className="rounded-none" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
              {progress !== null ? <Loader2 className="animate-spin" /> : <Upload />}
              {progress !== null ? `Uploading ${progress}%` : "Upload"}
            </Button>
          </div>
        </PermissionGate>
        </div>
        {canManageMedia && (
          <form onSubmit={(event) => void createFolder(event)} className="flex flex-wrap gap-2">
            <Input
              aria-label="New folder name"
              className="max-w-sm rounded-none"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="New folder (e.g. Campaigns/2026)"
              maxLength={255}
            />
            <Button type="submit" variant="outline" className="rounded-none" disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? <Loader2 className="animate-spin" /> : null}
              Create folder
            </Button>
          </form>
        )}
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
              return (
                <ContextMenuPrimitive.Root key={f.id}>
                  <ContextMenuPrimitive.Trigger asChild>
                    <div
                      className="group flex flex-col border bg-card"
                    >
                      <button
                        type="button"
                        className="relative aspect-square min-h-11 overflow-hidden bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        aria-label={`Preview ${f.name}`}
                        onClick={() => openPreview({
                          id: f.id,
                          isPublic: f.isPublic,
                          url: f.url,
                          name: f.name,
                          mimeType: f.mimeType,
                        })}
                      >
                        {f.kind === "image" && f.isPublic ? (
                          <MediaImage src={f.url} alt={f.alt ?? f.name} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" />
                        ) : (
                          <span className="flex size-full flex-col items-center justify-center gap-1 p-3 text-muted-foreground">
                            <FileText className="size-8" />
                            <span className="text-xs uppercase">{f.isPublic ? f.url.split(".").pop() : "Private file"}</span>
                          </span>
                        )}
                      </button>
                      <div className="space-y-1 p-2">
                        <p className="truncate text-sm font-medium" title={f.name}>{f.name}</p>
                        <p className="text-xs text-muted-foreground">{size(f.size)}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.isPublic ? "Public" : "Private"} · {f.folder?.name ?? "Unfiled"}
                        </p>
                        {canManageMedia && (
                          <div className="space-y-1 lg:hidden">
                            <Select
                              value={f.folderId === null ? "root" : String(f.folderId)}
                              onValueChange={(value) => void updateFile(f, { folderId: value === "root" ? null : Number(value) })}
                            >
                              <SelectTrigger aria-label={`Move ${f.name} to a folder`} className="min-h-11 rounded-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="root">Unfiled</SelectItem>
                                {folders.map((folder) => (
                                  <SelectItem key={folder.id} value={String(folder.id)}>{folder.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 lg:hidden">
                          <Button type="button" variant="ghost" className="min-h-11 rounded-none" onClick={() => openPreview({
                            id: f.id,
                            isPublic: f.isPublic,
                            url: f.url,
                            name: f.name,
                            mimeType: f.mimeType,
                          })} aria-label={`Preview ${f.name}`}><Eye /><span>Preview</span></Button>
                          {f.isPublic && <Button type="button" variant="ghost" className="min-h-11 rounded-none" onClick={() => void copy(f)} aria-label={`Copy link for ${f.name}`}><Copy /><span>Copy link</span></Button>}
                          {canManageMedia && (
                            <Button type="button" variant="outline" className="min-h-11 rounded-none" onClick={() => void updateFile(f, { isPublic: !f.isPublic })}>
                              {f.isPublic ? "Make private" : "Make public"}
                            </Button>
                          )}
                          <PermissionGate required={PERM.MEDIA_MANAGE}>
                            <Button type="button" variant="ghost" className="min-h-11 rounded-none" onClick={() => setRenaming(f)} aria-label={`Rename ${f.name}`}><Pencil /><span>Rename</span></Button>
                          </PermissionGate>
                          <PermissionGate required={PERM.MEDIA_DELETE}>
                            <Button type="button" variant="ghost" className="min-h-11 rounded-none text-destructive hover:text-destructive" onClick={() => setDeleting(f)} aria-label={`Delete ${f.name}`}><Trash2 /><span>Delete</span></Button>
                          </PermissionGate>
                        </div>
                        <div className="hidden justify-end px-2 pb-2 lg:flex">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="min-h-11 rounded-none"
                                aria-label={`More actions for ${f.name}`}
                              >
                                <Ellipsis aria-hidden="true" />
                                More actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="max-w-52 truncate">{f.name}</DropdownMenuLabel>
                              <DropdownMenuItem className="min-h-11" onSelect={() => openPreview({
                                id: f.id,
                                isPublic: f.isPublic,
                                url: f.url,
                                name: f.name,
                                mimeType: f.mimeType,
                              })}>
                                <Eye aria-hidden="true" /> Preview
                              </DropdownMenuItem>
                              {f.isPublic && (
                                <DropdownMenuItem className="min-h-11" onSelect={() => void copy(f)}>
                                  <Copy aria-hidden="true" /> Copy link
                                </DropdownMenuItem>
                              )}
                              {canManageMedia && (
                                <>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="min-h-11">Move to folder</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      <DropdownMenuItem className="min-h-11" disabled={f.folderId === null} onSelect={() => void updateFile(f, { folderId: null })}>
                                        Unfiled
                                      </DropdownMenuItem>
                                      {folders.map((folder) => (
                                        <DropdownMenuItem
                                          key={folder.id}
                                          className="min-h-11"
                                          disabled={f.folderId === folder.id}
                                          onSelect={() => void updateFile(f, { folderId: folder.id })}
                                        >
                                          {folder.name}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuItem className="min-h-11" onSelect={() => void updateFile(f, { isPublic: !f.isPublic })}>
                                    {f.isPublic ? "Make private" : "Make public"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="min-h-11" onSelect={() => setRenaming(f)}>
                                    <Pencil aria-hidden="true" /> Rename
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canDeleteMedia && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="min-h-11" variant="destructive" onSelect={() => setDeleting(f)}>
                                    <Trash2 aria-hidden="true" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </ContextMenuPrimitive.Trigger>
                  <ContextMenuPrimitive.Portal>
                    <ContextMenuPrimitive.Content className="z-50 max-h-[var(--radix-context-menu-content-available-height)] min-w-48 overflow-y-auto border bg-popover p-1 text-popover-foreground shadow-md">
                      <ContextMenuPrimitive.Label className="max-w-64 truncate px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {f.name}
                      </ContextMenuPrimitive.Label>
                      <ContextMenuPrimitive.Item
                        className={contextMenuItemClass}
                        onSelect={() => openPreview({
                          id: f.id,
                          isPublic: f.isPublic,
                          url: f.url,
                          name: f.name,
                          mimeType: f.mimeType,
                        })}
                      >
                        <Eye aria-hidden="true" /> Preview
                      </ContextMenuPrimitive.Item>
                      {f.isPublic && (
                        <ContextMenuPrimitive.Item className={contextMenuItemClass} onSelect={() => void copy(f)}>
                          <Copy aria-hidden="true" /> Copy link
                        </ContextMenuPrimitive.Item>
                      )}
                      {canManageMedia && (
                        <>
                          <ContextMenuPrimitive.Sub>
                            <ContextMenuPrimitive.SubTrigger className={cn(contextMenuItemClass, "justify-between")}>
                              Move to folder
                              <ChevronRight aria-hidden="true" />
                            </ContextMenuPrimitive.SubTrigger>
                            <ContextMenuPrimitive.Portal>
                              <ContextMenuPrimitive.SubContent className="z-50 max-h-[var(--radix-context-menu-content-available-height)] min-w-48 overflow-y-auto border bg-popover p-1 text-popover-foreground shadow-md">
                                <ContextMenuPrimitive.Item
                                  className={contextMenuItemClass}
                                  disabled={f.folderId === null}
                                  onSelect={() => void updateFile(f, { folderId: null })}
                                >
                                  Unfiled
                                </ContextMenuPrimitive.Item>
                                {folders.map((folder) => (
                                  <ContextMenuPrimitive.Item
                                    key={folder.id}
                                    className={contextMenuItemClass}
                                    disabled={f.folderId === folder.id}
                                    onSelect={() => void updateFile(f, { folderId: folder.id })}
                                  >
                                    {folder.name}
                                  </ContextMenuPrimitive.Item>
                                ))}
                              </ContextMenuPrimitive.SubContent>
                            </ContextMenuPrimitive.Portal>
                          </ContextMenuPrimitive.Sub>
                          <ContextMenuPrimitive.Item
                            className={contextMenuItemClass}
                            onSelect={() => void updateFile(f, { isPublic: !f.isPublic })}
                          >
                            {f.isPublic ? "Make private" : "Make public"}
                          </ContextMenuPrimitive.Item>
                          <ContextMenuPrimitive.Item className={contextMenuItemClass} onSelect={() => setRenaming(f)}>
                            <Pencil aria-hidden="true" /> Rename
                          </ContextMenuPrimitive.Item>
                        </>
                      )}
                      {canDeleteMedia && (
                        <>
                          <ContextMenuPrimitive.Separator className="my-1 h-px bg-border" />
                          <ContextMenuPrimitive.Item
                            className={cn(contextMenuItemClass, "text-destructive focus:bg-destructive/10 focus:text-destructive")}
                            onSelect={() => setDeleting(f)}
                          >
                            <Trash2 aria-hidden="true" /> Delete
                          </ContextMenuPrimitive.Item>
                        </>
                      )}
                    </ContextMenuPrimitive.Content>
                  </ContextMenuPrimitive.Portal>
                </ContextMenuPrimitive.Root>
              );
            })}
          </div>
        )}
      </div>

      <div className="border">
        <DataPagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} />
      </div>

      <PermissionGate required={PERM.MEDIA_MANAGE}>
        <RenameDialog file={renaming} onClose={() => setRenaming(null)} onSaved={refresh} />
      </PermissionGate>
      <PermissionGate required={PERM.MEDIA_DELETE}>
        <ConfirmDelete
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete this file?"
          description="The file is removed from the server. Any product or page still using its link will show a broken file."
          busy={busy}
          onConfirm={remove}
        />
      </PermissionGate>
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
          <div className="space-y-1.5"><Label htmlFor="media-file-name">Name</Label><Input id="media-file-name" className="rounded-none" value={name} onChange={(e) => setName(e.target.value)} /></div>
          {file?.kind === "image" && (
            <div className="space-y-1.5"><Label htmlFor="media-file-alt">Alt text</Label><Input id="media-file-alt" className="rounded-none" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" /></div>
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
