"use client";

import { MediaImage } from "@/components/media-image";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type Collection, type Product } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageField } from "../file-picker";

type Picked = { id: number; name: string };

export function CollectionDialog({
    open,
    onOpenChange,
    collection,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    collection: Collection | null;
    onSaved: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [featured, setFeatured] = useState(false);
    const [picked, setPicked] = useState<Picked[]>([]);
    const [nameError, setNameError] = useState("");
    const [saving, setSaving] = useState(false);

    // product picker
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query);
    const [results, setResults] = useState<Product[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(collection?.name ?? "");
        setDescription(collection?.description ?? "");
        setImage(collection?.image ?? "");
        setFeatured(!!collection?.featured);
        setNameError("");
        setQuery("");
        setPicked(
            collection
                ? collection.items?.length
                    ? collection.items.map((i) => ({ id: i.productId, name: i.product?.name ?? `Product #${i.productId}` }))
                    : collection.tileIds.map((id) => ({ id, name: `Product #${id}` }))
                : [],
        );
    }, [open, collection]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setSearching(true);
        api
            .getProducts({ search: debouncedQuery || undefined, skip: 0, limit: 20 })
            .then((r) => !cancelled && setResults(r.products))
            .catch(() => !cancelled && setResults([]))
            .finally(() => !cancelled && setSearching(false));
        return () => {
            cancelled = true;
        };
    }, [open, debouncedQuery]);

    const isPicked = (id: number) => picked.some((p) => p.id === id);
    const toggle = (p: Product) =>
        setPicked((cur) => (cur.some((x) => x.id === p.id) ? cur.filter((x) => x.id !== p.id) : [...cur, { id: p.id, name: p.name }]));

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setNameError("Enter a collection name");
            return;
        }

        const payload: Omit<Collection, "id"> = {
            name: name.trim(),
            description: description.trim(),
            image: image.trim(),
            featured,
            tileIds: picked.map((p) => p.id),
        };

        setSaving(true);
        try {
            if (collection) await api.updateCollection(collection.id, payload);
            else await api.createCollection(payload);
            toast.success(collection ? "Collection updated" : "Collection created");
            onSaved();
            onOpenChange(false);
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not save the collection"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
            <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-none p-0 sm:max-w-3xl">
                <form onSubmit={submit} className="flex max-h-[92vh] flex-col">
                    <DialogHeader className="border-b p-4">
                        <DialogTitle>{collection ? "Edit collection" : "New collection"}</DialogTitle>
                        <DialogDescription>Group tiles into a series customers can browse together.</DialogDescription>
                    </DialogHeader>

                    <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-4 md:grid-cols-2">
                        {/* Details */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="collection-name">Name</Label>
                                <Input
                                    id="collection-name"
                                    className="rounded-none"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setNameError("");
                                    }}
                                    placeholder="Marble Series"
                                />
                                {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="collection-description">Description</Label>
                                <Textarea id="collection-description" className="min-h-24 rounded-none" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-sm font-medium">Cover image</span>
                                <ImageField ariaLabel="Collection cover image URL" value={image ?? ""} kind="image" onChange={(value) => setImage(value)} />
                                {image.trim() && (
                                    <div className="mt-2 aspect-video w-full max-w-60 overflow-hidden border bg-muted">
                                        <MediaImage src={image} alt="Preview" className="size-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="flex min-h-11 items-center gap-2 text-sm">
                                <Checkbox
                                    checked={featured}
                                    onCheckedChange={(checked) => setFeatured(checked === true)}
                                    aria-label="Feature this collection on the home page"
                                    className="size-11 p-3"
                                />
                                <span>Feature this collection on the home page</span>
                            </div>
                        </div>

                        {/* Product picker */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Products in this collection ({picked.length})</h3>

                            {picked.length > 0 && (
                                <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                                    {picked.map((p) => (
                                        <Badge key={p.id} variant="secondary" className="gap-1 rounded-none">
                                            {p.name}
                                            <button type="button" className="flex size-11 shrink-0 items-center justify-center" onClick={() => setPicked((c) => c.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.name}`}>
                                                <X aria-hidden="true" className="size-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="relative">
                                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                <Label htmlFor="collection-product-search" className="sr-only">Search products to add</Label>
                                <Input id="collection-product-search" className="rounded-none pl-8" placeholder="Search products to add" value={query} onChange={(e) => setQuery(e.target.value)} />
                            </div>

                            <div className="max-h-64 overflow-y-auto border">
                                {searching && results.length === 0 ? (
                                    <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                                        <Loader2 className="size-4 animate-spin" /> Searching…
                                    </p>
                                ) : results.length === 0 ? (
                                    <p className="p-4 text-sm text-muted-foreground">No products match “{query}”.</p>
                                ) : (
                                    <ul className="divide-y">
                                        {results.map((p) => (
                                            <li key={p.id}>
                                                <div className="flex min-h-11 items-center gap-3 p-2.5 hover:bg-accent">
                                                    <Checkbox
                                                        checked={isPicked(p.id)}
                                                        onCheckedChange={() => toggle(p)}
                                                        aria-label={`Add ${p.name} to this collection`}
                                                        className="size-11 shrink-0 p-3"
                                                    />
                                                    <span className="size-9 shrink-0 overflow-hidden bg-muted">
                                                        {p.image && <MediaImage src={p.image} alt="" className="size-full object-cover" />}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-medium">{p.name}</span>
                                                        <span className="block truncate text-xs text-muted-foreground">{p.categoryLabel}</span>
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Showing the first 20 matches. Search to find others.</p>
                        </div>
                    </div>

                    <DialogFooter className="border-t p-4">
                        <Button type="button" variant="outline" className="rounded-none" onClick={() => onOpenChange(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" className="rounded-none" disabled={saving}>
                            {saving && <Loader2 className="animate-spin" />}
                            {collection ? "Save changes" : "Create collection"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}