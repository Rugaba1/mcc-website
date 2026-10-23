"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type AdminReview } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [status, setStatus] = useState<"pending" | "approved" | "all">("pending");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.getAdminReviews(page, status);
            setReviews(response.reviews);
            setTotal(response.total);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not load reviews"));
        } finally {
            setLoading(false);
        }
    }, [page, status]);

    useEffect(() => { void load(); }, [load]);

    const moderate = async (review: AdminReview, approved: boolean) => {
        setBusyId(review.id);
        try {
            await api.moderateReview(review.id, approved);
            toast.success(approved ? "Review approved" : "Review unpublished");
            await load();
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not update review"));
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (review: AdminReview) => {
        if (!confirm(`Permanently delete this review for ${review.product.name}?`)) return;
        setBusyId(review.id);
        try {
            await api.deleteReview(review.id);
            toast.success("Review deleted");
            await load();
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not delete review"));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <main className="space-y-5 p-4 md:p-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Product reviews</h1>
                    <p className="text-sm text-muted-foreground">Approve customer reviews before they appear on product pages and in search metadata.</p>
                </div>
                <Select value={status} onValueChange={(value) => { setStatus(value as typeof status); setPage(1); }}>
                    <SelectTrigger className="w-44 rounded-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-none">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="all">All reviews</SelectItem>
                    </SelectContent>
                </Select>
            </header>

            <p className="text-xs text-muted-foreground">{total} review{total === 1 ? "" : "s"}</p>

            {loading ? (
                <div className="flex justify-center border py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : reviews.length === 0 ? (
                <div className="flex min-h-48 items-center justify-center border text-sm text-muted-foreground">No reviews in this queue.</div>
            ) : (
                <div className="divide-y border">
                    {reviews.map((review) => (
                        <article key={review.id} className="space-y-3 p-4 md:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <a href={`/products/${review.productId}#reviews`} className="font-semibold text-primary underline-offset-4 hover:underline">{review.product.name}</a>
                                    <p className="text-xs text-muted-foreground">{review.author} · {review.user.email} · {fmtDateTime(review.createdAt)}</p>
                                </div>
                                <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                                    {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />)}
                                </div>
                            </div>
                            {review.title && <h2 className="font-semibold">{review.title}</h2>}
                            <div className="prose prose-sm max-w-none text-foreground prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-a:text-primary">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.body}</ReactMarkdown>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <Button size="sm" disabled={busyId === review.id} onClick={() => void moderate(review, !review.approved)}>
                                    {busyId === review.id ? "Saving…" : review.approved ? "Unpublish" : "Approve"}
                                </Button>
                                <Button size="sm" variant="destructive" disabled={busyId === review.id} onClick={() => void remove(review)}><Trash2 /> Delete</Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <nav className="flex items-center justify-between" aria-label="Review moderation pages">
                    <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" disabled={loading || page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
                </nav>
            )}
        </main>
    );
}
