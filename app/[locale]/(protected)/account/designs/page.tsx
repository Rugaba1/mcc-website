"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Loader2, Palette, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type SavedVisualizerDesign } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function AccountDesignsPage() {
    const [designs, setDesigns] = useState<SavedVisualizerDesign[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setDesigns(await api.getMyVisualizerDesigns());
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not load your designs"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const remove = async (design: SavedVisualizerDesign) => {
        if (!confirm(`Delete “${design.name || "Untitled design"}”?`)) return;
        try {
            await api.deleteMyVisualizerDesign(design.id);
            setDesigns((current) => current.filter((item) => item.id !== design.id));
            toast.success("Design deleted");
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not delete design"));
        }
    };

    const copyShareLink = async (token: string) => {
        await navigator.clipboard.writeText(`${window.location.origin}/visualizer?design=${token}`);
        toast.success("Share link copied");
    };

    return (
        <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">My Designs</h1>
                    <p className="text-sm text-muted-foreground">Saved room visualizer designs.</p>
                </div>
                <Button asChild variant="outline"><Link href="/visualizer"><Palette /> Open visualizer</Link></Button>
            </header>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : designs.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 border text-center">
                    <Palette className="size-7 text-muted-foreground" />
                    <p className="font-medium">No saved designs yet</p>
                    <p className="text-sm text-muted-foreground">Save a room design from the visualizer to see it here.</p>
                    <Button asChild><Link href="/visualizer">Start a design</Link></Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {designs.map((design) => (
                        <article key={design.id} className="overflow-hidden border bg-background">
                            <div className="relative aspect-4/3 bg-muted">
                                {design.previewImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={design.previewImage} alt="" className="size-full object-cover" />
                                ) : <div className="flex size-full items-center justify-center"><Palette className="size-8 text-muted-foreground" /></div>}
                            </div>
                            <div className="space-y-3 p-4">
                                <div>
                                    <h2 className="truncate font-semibold">{design.name || "Untitled design"}</h2>
                                    <p className="text-sm text-muted-foreground">{design.scene?.name ?? "Custom room"} · {design.items.length} surfaces</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Updated {fmtDate(design.updatedAt)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {design.shareToken && <Button asChild size="sm"><Link href={`/visualizer?design=${design.shareToken}`}><ExternalLink /> Open</Link></Button>}
                                    {design.shareToken && <Button type="button" size="sm" variant="outline" onClick={() => void copyShareLink(design.shareToken!)}><Copy /> Share</Button>}
                                    <Button type="button" size="icon" variant="ghost" aria-label="Delete design" onClick={() => void remove(design)}><Trash2 /></Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
