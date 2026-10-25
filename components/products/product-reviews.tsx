"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type ProductReviewData, type ProductReviewSummary } from "@/lib/api";
import { PermissionGate } from "@/components/permission-gate";
import { CUSTOMER_PERM } from "@/lib/permissions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReviewMarkdownEditor } from "@/components/products/review-markdown-editor";
import { useFormatters } from "@/contexts/format-context";

const emptyData: ProductReviewData = {
    reviews: [], total: 0, page: 1, pageSize: 5, totalPages: 1,
    averageRating: null, canReview: false, authenticated: false, myReview: null,
};

function Stars({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className={`size-4 ${index < rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
            ))}
        </span>
    );
}

export function ProductReviews({
    productId,
    initialData,
}: {
    productId: number;
    initialData?: ProductReviewSummary;
}) {
    const { date } = useFormatters();
    const [data, setData] = useState<ProductReviewData>(() => initialData
        ? { ...initialData, canReview: false, authenticated: false, myReview: null }
        : emptyData);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(!initialData);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const load = useCallback(async (requestedPage: number, signal?: AbortSignal) => {
        setLoading(true);
        try {
            const response = await api.getProductReviews(productId, requestedPage, signal);
            setData(response);
            setPage(response.page);
        } catch (error) {
            if (!signal?.aborted) toast.error(apiErrorMessage(error, "Could not load reviews"));
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        const controller = new AbortController();
        void load(page, controller.signal);
        return () => controller.abort();
    }, [load, page]);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            const response = await api.submitProductReview(productId, { rating, title, body });
            toast.success(response.message);
            setTitle("");
            setBody("");
            setRating(5);
            await load(1);
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not submit your review"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="reviews" className="mt-20 border-t border-border pt-12">
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="font-playfair text-3xl font-bold">Customer reviews</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Reviews are from customers with a paid order for this product.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Stars rating={Math.round(data.averageRating ?? 0)} />
                    <span className="font-semibold">{data.averageRating?.toFixed(1) ?? "—"}</span>
                    <span className="text-sm text-muted-foreground">({data.total})</span>
                </div>
            </header>

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">
                    {loading && data.reviews.length === 0 ? (
                        <p className="py-8 text-sm text-muted-foreground">Loading reviews…</p>
                    ) : data.reviews.length === 0 ? (
                        <p className="border border-dashed border-border p-8 text-sm text-muted-foreground">No approved reviews yet.</p>
                    ) : (
                        data.reviews.map((review) => (
                            <article key={review.id} className="border-b border-border pb-5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Stars rating={review.rating} />
                                    <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>
                                        {date(review.createdAt)}
                                    </time>
                                </div>
                                {review.title && <h3 className="mt-2 font-semibold">{review.title}</h3>}
                                <div className="prose prose-sm mt-2 max-w-none text-foreground prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-a:text-primary">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.body}</ReactMarkdown>
                                </div>
                                <p className="mt-3 text-xs text-muted-foreground">Verified purchase · {review.author}</p>
                            </article>
                        ))
                    )}

                    {data.totalPages > 1 && (
                        <nav className="flex items-center justify-between pt-2" aria-label="Review pages">
                            <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
                            <Button variant="outline" disabled={loading || page >= data.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
                        </nav>
                    )}
                </div>

                <aside className="border border-border p-5">
                    <h3 className="text-lg font-semibold">Write a review</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Share your experience with this tile.</p>
                    {data.myReview ? (
                        <div className="mt-4 border-l-2 border-primary pl-3 text-sm">
                            {data.myReview.approved ? "You have already reviewed this product." : "Your review is awaiting staff approval."}
                        </div>
                    ) : data.canReview ? (
                        <PermissionGate required={CUSTOMER_PERM.REVIEWS_CREATE}>
                        <form onSubmit={submit} className="mt-5 space-y-4">
                            <fieldset>
                                <legend className="mb-2 text-sm font-medium">Rating</legend>
                                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                                    {Array.from({ length: 5 }, (_, index) => {
                                        const value = index + 1;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                role="radio"
                                                aria-checked={rating === value}
                                                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                                                onClick={() => setRating(value)}
                                                className="p-1"
                                            >
                                                <Star className={`size-5 ${value <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </fieldset>
                            <div className="space-y-2">
                                <Label htmlFor={`review-title-${productId}`}>Title (optional)</Label>
                                <Input id={`review-title-${productId}`} value={title} maxLength={150} onChange={(event) => setTitle(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`review-body-${productId}`}>Review</Label>
                                <ReviewMarkdownEditor
                                    id={`review-body-${productId}`}
                                    value={body}
                                    onChange={setBody}
                                />
                                <p className="text-xs text-muted-foreground">Reviews are published after staff approval.</p>
                            </div>
                            <Button type="submit" className="w-full" disabled={submitting || body.trim().length < 3}>
                                {submitting ? "Submitting…" : "Submit review"}
                            </Button>
                        </form>
                        </PermissionGate>
                    ) : data.authenticated ? (
                        <p className="mt-4 text-sm text-muted-foreground">A paid order for this product and review access are required before you can submit a review.</p>
                    ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                            <Link href="/login" className="text-primary underline underline-offset-4">Sign in</Link> with the account used for your purchase to leave a review.
                        </p>
                    )}
                </aside>
            </div>
        </section>
    );
}
