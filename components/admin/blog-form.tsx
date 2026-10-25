"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/app/i18n/routing";
import { api, apiErrorMessage, type BlogPostInput, type BlogStatus } from "@/lib/api";
import { slugify } from "@/lib/blog/slug";
import { MdxEditor } from "@/components/admin/mdx-editor";
import { ImagePickerDialog } from "@/components/admin/image-picker-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { hasPermissions } from "@/lib/permissions/core";
import { useAuth } from "@/contexts/auth-context";

type Form = Required<Pick<BlogPostInput, "title" | "slug" | "locale" | "excerpt" | "content" | "coverImage" | "coverAlt" | "tags" | "status" | "featured" | "seoTitle" | "seoDescription">>;

const empty: Form = {
    title: "", slug: "", locale: "en", excerpt: "", content: "", coverImage: "", coverAlt: "",
    tags: [], status: "DRAFT", featured: false, seoTitle: "", seoDescription: "",
};

const Counter = ({ value, max }: { value: string; max: number }) => (
    <span className={`text-xs ${value.length > max ? "text-destructive" : "text-muted-foreground"}`}>
        {value.length}/{max}
    </span>
);

export function BlogForm({ postId }: { postId?: number }) {
    const router = useRouter();
    const { user } = useAuth();
    const [form, setForm] = useState<Form>(empty);
    const [tagsText, setTagsText] = useState("");
    const [slugTouched, setSlugTouched] = useState(!!postId);
    const [loading, setLoading] = useState(!!postId);
    const [saving, setSaving] = useState(false);
    const [pickingCover, setPickingCover] = useState(false);
    const [id, setId] = useState(postId);

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

    useEffect(() => {
        if (!postId) return;
        api.getAdminBlogPost(postId)
            .then((p) => {
                setForm({
                    title: p.title, slug: p.slug, locale: p.locale, excerpt: p.excerpt ?? "", content: p.content,
                    coverImage: p.coverImage ?? "", coverAlt: p.coverAlt ?? "", tags: p.tags, status: p.status,
                    featured: p.featured, seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
                });
                setTagsText(p.tags.join(", "));
            })
            .catch((e) => toast.error(apiErrorMessage(e, "Failed to load the post")))
            .finally(() => setLoading(false));
    }, [postId]);

    const save = async () => {
        if (!form.title.trim() || !form.content.trim()) return toast.error("Title and content are required");
        setSaving(true);
        try {
            const payload: BlogPostInput = {
                ...form,
                tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
                coverImage: form.coverImage || null,
                coverAlt: form.coverAlt || null,
            };
            if (id) {
                const p = await api.updateBlogPost(id, payload);
                set("slug", p.slug);
                toast.success("Post saved");
            } else {
                const p = await api.createBlogPost(payload);
                toast.success("Post created");
                setId(p.id);
                router.replace(`/admin/blog/${p.id}`);
            }
        } catch (e) {
            toast.error(apiErrorMessage(e, "Could not save the post"));
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return <p className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading post…</p>;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="mr-auto text-2xl">{id ? "Edit post" : "New post"}</h1>
                <Button asChild variant="outline" className="rounded-none"><Link href="/admin/blog">Back</Link></Button>
                {id && (
                    <Button asChild variant="outline" className="rounded-none">
                        <Link href={`/admin/blog/${id}/preview`} target="_blank"><ExternalLink /> Preview</Link>
                    </Button>
                )}
                <PermissionGate required={PERM.BLOG_WRITE}>
                    <Button className="rounded-none" onClick={save} disabled={saving}>
                        {saving && <Loader2 className="animate-spin" />}
                        {form.status === "PUBLISHED" ? (id ? "Save & publish" : "Publish") : "Save"}
                    </Button>
                </PermissionGate>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Main column */}
                <div className="space-y-4 lg:col-span-2">
                    <Card className="rounded-none shadow-none">
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-1.5">
                                <Label>Title</Label>
                                <Input className="rounded-none" value={form.title}
                                    onChange={(e) => {
                                        set("title", e.target.value);
                                        if (!slugTouched) set("slug", slugify(e.target.value));
                                    }} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Slug</Label>
                                <Input className="rounded-none" value={form.slug}
                                    onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
                                <p className="text-xs text-muted-foreground">Changing the slug of a published post breaks its existing links.</p>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between"><Label>Excerpt</Label><Counter value={form.excerpt ?? ""} max={160} /></div>
                                <Textarea className="rounded-none" rows={3} value={form.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-none shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base">Content (MDX)</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Use the post preview to review any embedded MDX components.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <MdxEditor
                                value={form.content ?? ""}
                                onChange={(v) => set("content", v)}
                                enableImages={hasPermissions(user?.permissions ?? [], PERM.MEDIA_VIEW)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card className="rounded-none shadow-none">
                        <CardHeader><CardTitle className="text-base">Publishing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <PermissionGate required={PERM.BLOG_PUBLISH}>
                                    <Select value={form.status} onValueChange={(v) => set("status", v as BlogStatus)}>
                                        <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            <SelectItem value="DRAFT">Draft</SelectItem>
                                            <SelectItem value="PUBLISHED">Published</SelectItem>
                                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </PermissionGate>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Language</Label>
                                <Select value={form.locale} onValueChange={(v) => set("locale", v)}>
                                    <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-none">
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="fr">Français</SelectItem>
                                        <SelectItem value="rw">Kinyarwanda</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <PermissionGate required={PERM.BLOG_PUBLISH}>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="featured">Featured</Label>
                                    <Switch id="featured" checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
                                </div>
                            </PermissionGate>
                        </CardContent>
                    </Card>

                    <Card className="rounded-none shadow-none">
                        <CardHeader><CardTitle className="text-base">Cover image</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {form.coverImage ? (
                                <div className="relative border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={form.coverImage} alt={form.coverAlt || ""} className="aspect-video w-full object-cover" />
                                    <Button type="button" size="icon" variant="secondary" className="absolute right-1.5 top-1.5 size-7 rounded-none"
                                        onClick={() => { set("coverImage", ""); set("coverAlt", ""); }} aria-label="Remove cover"><X /></Button>
                                </div>
                            ) : null}
                            <PermissionGate required={PERM.MEDIA_VIEW}>
                                <Button type="button" variant="outline" className="w-full rounded-none" onClick={() => setPickingCover(true)}>
                                    <ImageIcon /> {form.coverImage ? "Change image" : "Choose image"}
                                </Button>
                            </PermissionGate>
                            {form.coverImage && (
                                <div className="space-y-1.5">
                                    <Label>Alt text</Label>
                                    <Input className="rounded-none" value={form.coverAlt ?? ""} onChange={(e) => set("coverAlt", e.target.value)} placeholder="Describe the image" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-none shadow-none">
                        <CardHeader><CardTitle className="text-base">Tags</CardTitle></CardHeader>
                        <CardContent>
                            <Input className="rounded-none" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="flooring, kigali, porcelain" />
                            <p className="mt-1.5 text-xs text-muted-foreground">Separate with commas.</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-none shadow-none">
                        <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between"><Label>SEO title</Label><Counter value={form.seoTitle ?? ""} max={60} /></div>
                                <Input className="rounded-none" value={form.seoTitle ?? ""} placeholder={form.title} onChange={(e) => set("seoTitle", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between"><Label>Meta description</Label><Counter value={form.seoDescription ?? ""} max={160} /></div>
                                <Textarea className="rounded-none" rows={3} value={form.seoDescription ?? ""} placeholder={form.excerpt ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />
                            </div>
                            <p className="text-xs text-muted-foreground">Left blank, the title and excerpt are used.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <PermissionGate required={PERM.MEDIA_VIEW}>
                <ImagePickerDialog open={pickingCover} onOpenChange={setPickingCover}
                    onSelect={(f) => { set("coverImage", f.url); set("coverAlt", f.alt ?? ""); }} />
            </PermissionGate>
        </div>
    );
}