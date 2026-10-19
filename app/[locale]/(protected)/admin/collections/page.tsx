"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type Collection } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CollectionDialog } from "@/components/admin/collection-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { DataPagination } from "@/components/admin/data-pagination";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 10;

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState<Collection | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCollections(await api.getCollections());
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load collections"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // The API returns every collection, so search and paging happen here.
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q));
  }, [collections, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Collection) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.deleteCollection(deleting.id);
      toast.success(`“${deleting.name}” deleted`);
      setDeleting(null);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not delete the collection"));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <main className="flex-1 space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground">Series that group tiles together on the site.</p>
        </div>
        <Button className="rounded-none" onClick={openCreate}>
          <Plus /> Add collection
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="rounded-none pl-8" placeholder="Search collections" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {search && (
          <Button variant="ghost" className="rounded-none" onClick={() => setSearch("")}>
            <X /> Clear
          </Button>
        )}
      </div>

      <div className="border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Cover</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && collections.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full rounded-none" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center gap-2 py-14 text-sm text-muted-foreground">
                    <Layers className="size-7" />
                    {search ? "No collections match your search." : "No collections yet."}
                    {!search && (
                      <Button className="mt-1 rounded-none" onClick={openCreate}>
                        <Plus /> Create your first collection
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="h-11 w-16 overflow-hidden border bg-muted">
                      {c.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt={c.name} className="size-full object-cover" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">{c.description || "—"}</TableCell>
                  <TableCell>{c.tileIds.length}</TableCell>
                  <TableCell>
                    {c.featured ? (
                      <Badge variant="secondary" className="gap-1 rounded-none">
                        <Star className="size-3 fill-amber-400 text-amber-400" /> Featured
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-none text-destructive hover:text-destructive"
                        onClick={() => setDeleting(c)}
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <DataPagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <CollectionDialog open={dialogOpen} onOpenChange={setDialogOpen} collection={editing} onSaved={load} />

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this collection?"
        description={`“${deleting?.name ?? ""}” will be removed. The products inside it are not deleted.`}
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </main>
  );
}