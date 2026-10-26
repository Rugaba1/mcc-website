"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Palette, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type SavedVisualizerDesign } from "@/lib/api";
import { useFormatters } from "@/contexts/format-context";
import { Button } from "@/components/ui/button";
import { ShareWidget } from "@/components/share-widget";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DataPagination } from "@/components/admin/data-pagination";
import { MediaImage } from "@/components/media-image";

const PAGE_SIZE = 18;
export default function AdminSavedDesignsPage() {
  const { dateTime } = useFormatters();
    const [designs, setDesigns] = useState<SavedVisualizerDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const q = useDebouncedValue(search, 250);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.getAdminVisualizerDesignsPage(page, PAGE_SIZE, q.trim());
            setDesigns(result.items);
            setTotal(result.total);
            setTotalPages(result.totalPages);
            if (result.page !== page) setPage(result.page);
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not load saved designs"));
        } finally {
            setLoading(false);
        }
    }, [page, q]);

    useEffect(() => { void load(); }, [load]);
    useEffect(() => { setPage(1); }, [q]);

    const remove = async (design: SavedVisualizerDesign) => {
        if (!confirm(`Delete “${design.name || "Untitled design"}”?`)) return;
        try {
            await api.deleteAdminVisualizerDesign(design.id);
            toast.success("Design deleted");
            await load();
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not delete design"));
        }
    };

    const visible = designs;

    return (
        <main className="space-y-6">
            <header>
                <h1 className="text-2xl font-semibold">Saved Designs</h1>
                <p className="text-sm text-muted-foreground">Browse customer and guest room visualizer designs.</p>
            </header>

            <Input
                className="max-w-md rounded-none"
                placeholder="Search design, customer or tile…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : visible.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 border text-center">
                    <Palette className="size-7 text-muted-foreground" />
                    <p className="font-medium">{q ? "No matching designs" : "No saved designs yet"}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visible.map((design) => (
                        <article key={design.id} className="overflow-hidden border bg-background">
                            <div className="relative aspect-4/3 bg-muted">
                                {design.previewImage && design.shareToken ? (
                                    <MediaImage src={`/api/visualizer/designs/${design.shareToken}/preview`} alt={`${design.name || "Saved design"} preview`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                                ) : (
                                    <div className="flex size-full items-center justify-center"><Palette className="size-8 text-muted-foreground" /></div>
                                )}
                            </div>
                            <div className="space-y-3 p-4">
                                <div>
                                    <h2 className="truncate font-semibold">{design.name || "Untitled design"}</h2>
                                    <p className="text-sm text-muted-foreground">{design.scene?.name ?? "Custom room"} · {design.items.length} surfaces</p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {design.user ? `${design.user.firstName} ${design.user.lastName ?? ""} · ${design.user.email}` : "Guest design"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Updated {dateTime(design.updatedAt)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {design.shareToken && <Button asChild size="sm"><Link href={`/visualizer/design/${design.shareToken}`}><ExternalLink /> Open</Link></Button>}
                                    {design.shareToken && <ShareWidget title={design.name || "Saved room design"} text={`View this ${design.scene?.name ?? "room"} design on Mountain Ceramics Company.`} path={`/visualizer/design/${design.shareToken}`} />}
                                    <PermissionGate required={PERM.CONTENT_MANAGE}>
                                        <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${design.name || "design"}`} onClick={() => void remove(design)}><Trash2 /></Button>
                                    </PermissionGate>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
            {!loading && total > 0 && (
                <DataPagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                    disabled={loading}
                />
            )}
        </main>
    );
}