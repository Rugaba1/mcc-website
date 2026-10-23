"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Palette, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type SavedVisualizerDesign } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSavedDesignsPage() {
    const [designs, setDesigns] = useState<SavedVisualizerDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        try {
            setDesigns(await api.getAdminVisualizerDesigns());
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not load saved designs"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const remove = async (design: SavedVisualizerDesign) => {
        if (!confirm(`Delete “${design.name || "Untitled design"}”?`)) return;
        try {
            await api.deleteAdminVisualizerDesign(design.id);
            setDesigns((current) => current.filter((item) => item.id !== design.id));
            toast.success("Design deleted");
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not delete design"));
        }
    };

    const query = search.trim().toLowerCase();
    const visible = designs.filter((design) => {
        const owner = design.user
            ? `${design.user.firstName} ${design.user.lastName ?? ""} ${design.user.email}`
            : "guest";
        const products = design.items.map((item) => item.variant.product.name).join(" ");
        return !query || `${design.name ?? ""} ${owner} ${design.scene?.name ?? ""} ${products}`.toLowerCase().includes(query);
    });

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
                    <p className="font-medium">{designs.length ? "No matching designs" : "No saved designs yet"}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visible.map((design) => (
                        <article key={design.id} className="overflow-hidden border bg-background">
                            <div className="relative aspect-4/3 bg-muted">
                                {design.previewImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={design.previewImage} alt="" className="size-full object-cover" />
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
                                    <p className="text-xs text-muted-foreground">Updated {fmtDateTime(design.updatedAt)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {design.shareToken && <Button asChild size="sm"><Link href={`/visualizer?design=${design.shareToken}`}><ExternalLink /> Open</Link></Button>}
                                    <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${design.name || "design"}`} onClick={() => void remove(design)}><Trash2 /></Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}