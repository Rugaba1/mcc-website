"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type BlogPostSummary, type BlogStatus } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { DataPagination } from "@/components/admin/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { useFormatters } from "@/contexts/format-context";

const PAGE_SIZE = 15;
type Filter = "all" | BlogStatus;
const variant: Record<BlogStatus, "default" | "secondary" | "outline"> = {
    PUBLISHED: "default", DRAFT: "secondary", ARCHIVED: "outline",
};

export default function AdminBlogPage() {
    const { date } = useFormatters();
    const [filter, setFilter] = useState<Filter>("all");
    const [search, setSearch] = useState("");
    const q = useDebouncedValue(search);
    const [page, setPage] = useState(1);
    const [posts, setPosts] = useState<BlogPostSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [deleting, setDeleting] = useState<BlogPostSummary | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => setPage(1), [q, filter]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api
            .getAdminBlogPosts({ q: q || undefined, status: filter === "all" ? undefined : filter, page, limit: PAGE_SIZE })
            .then((r) => {
                if (cancelled) return;
                setPosts(r.posts); setTotal(r.total); setTotalPages(r.totalPages);
            })
            .catch((e) => !cancelled && toast.error(apiErrorMessage(e, "Failed to load posts")))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [q, filter, page, refreshKey]);

    const remove = async () => {
        if (!deleting) return;
        setBusy(true);
        try {
            await api.deleteBlogPost(deleting.id);
            toast.success("Post deleted");
            setDeleting(null);
            if (posts.length === 1 && page > 1) setPage(page - 1);
            else setRefreshKey((k) => k + 1);
        } catch (e) {
            toast.error(apiErrorMessage(e, "Could not delete the post"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="mr-auto text-2xl">Blog</h1>
                <PermissionGate required={PERM.BLOG_WRITE}>
                    <Button asChild className="rounded-none">
                        <Link href="/admin/blog/new"><Plus /> New post</Link>
                    </Button>
                </PermissionGate>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-52 flex-1 sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input className="rounded-none pl-8" placeholder="Search title, slug or tag" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                    <TabsList className="rounded-none">
                        <TabsTrigger value="all" className="rounded-none">All</TabsTrigger>
                        <TabsTrigger value="PUBLISHED" className="rounded-none">Published</TabsTrigger>
                        <TabsTrigger value="DRAFT" className="rounded-none">Drafts</TabsTrigger>
                        <TabsTrigger value="ARCHIVED" className="rounded-none">Archived</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className={`border ${loading ? "opacity-60" : ""}`}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Language</TableHead>
                            <TableHead className="hidden md:table-cell">Author</TableHead>
                            <TableHead className="hidden lg:table-cell">Published</TableHead>
                            <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && posts.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                                <Loader2 className="mr-2 inline size-4 animate-spin" />Loading posts…
                            </TableCell></TableRow>
                        ) : posts.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                                {q || filter !== "all" ? "No posts match your filters." : "No posts yet. Create the first one."}
                            </TableCell></TableRow>
                        ) : posts.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="max-w-sm">
                                    <p className="truncate font-medium">{p.title}</p>
                                    <p className="truncate text-xs text-muted-foreground">/{p.slug}</p>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={variant[p.status]} className="rounded-none">{p.status.toLowerCase()}</Badge>
                                    {p.featured && <Badge variant="secondary" className="ml-1 rounded-none">featured</Badge>}
                                </TableCell>
                                <TableCell className="hidden uppercase md:table-cell">{p.locale}</TableCell>
                                <TableCell className="hidden md:table-cell">{p.authorName ?? "—"}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    {date(p.publishedAt)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-0.5">
                                        <PermissionGate required={PERM.BLOG_WRITE}>
                                            <Button asChild variant="ghost" size="icon" className="size-8 rounded-none" aria-label="Edit">
                                                <Link href={`/admin/blog/${p.id}`}><Pencil /></Link>
                                            </Button>
                                        </PermissionGate>
                                        {p.status === "PUBLISHED" && (
                                            <Button asChild variant="ghost" size="icon" className="size-8 rounded-none" aria-label="View live">
                                                <a href={`/${p.locale}/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink /></a>
                                            </Button>
                                        )}
                                        <PermissionGate required={PERM.BLOG_DELETE}>
                                            <Button variant="ghost" size="icon" className="size-8 rounded-none text-destructive hover:text-destructive"
                                                onClick={() => setDeleting(p)} aria-label="Delete"><Trash2 /></Button>
                                        </PermissionGate>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="border-t">
                    <DataPagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} />
                </div>
            </div>

            <PermissionGate required={PERM.BLOG_DELETE}>
                <ConfirmDelete
                    open={!!deleting}
                    onOpenChange={(o) => !o && setDeleting(null)}
                    title="Delete this post?"
                    description="The post is removed permanently and its URL will return a 404. Consider archiving instead."
                    busy={busy}
                    onConfirm={remove}
                />
            </PermissionGate>
        </div>
    );
}