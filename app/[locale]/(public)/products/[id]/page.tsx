
import Image from "next/image";
import Link from "next/link";
import { type Product, serverApi, type ProductReviewSummary } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { absolutizeUrl } from "@/lib/absolutize";
import { createPageMetadata } from "@/lib/seo/metadata";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductReviews } from "@/components/products/product-reviews";
import { ProductPurchase } from "@/components/product-purchase";

function badgeStyle(badge: Product["badge"]) {
  if (badge === "New") return "bg-success text-success-foreground";
  if (badge === "Premium") return "bg-accent ";
  if (badge === "Bestseller") return "bg-primary ";
  return "";
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string, id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  let tile = null;
  let reviews: ProductReviewSummary | null = null;
  try {
    tile = await serverApi.getProduct(id);
    reviews = await serverApi.getProductReviews(String(tile.id));
  } catch {
    // Product metadata remains available if review lookup fails.
  }
  const reviewSummary = reviews?.total && reviews.averageRating !== null
    ? ` Rated ${reviews.averageRating.toFixed(1)} out of 5 from ${reviews.total} customer reviews.`
    : "";
  const title = `${tile?.name ?? "Tile Product"} | ${siteConfig.siteName}`;
  const description =
    `${tile?.description ?? "Explore ceramic and porcelain tiles manufactured in Rwanda."}${reviewSummary}`.slice(0, 300);
  return createPageMetadata({
    locale,
    path: `/products/${tile?.slug ?? id}`,
    title,
    description,
    image: tile?.image ? absolutizeUrl(tile.image) ?? "/logo.png" : "/logo.png",
  });
}

export default async function TileDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string, id: string }>;
  searchParams: Promise<{ active?: string }>;
}) {
  const { id } = await params

  let tile = null;
  let reviews: ProductReviewSummary | null = null;
  try {
    tile = await serverApi.getProduct(id);
    reviews = await serverApi.getProductReviews(String(tile.id));
  } catch {
    // Keep the product page available when review data is temporarily unavailable.
  }





  if (!tile) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <p className=" font-semibold text-lg">Tile not found</p>
          <Link href="/catalogue" className=" hover:underline text-sm mt-2 inline-block">
            ← Back to catalogue
          </Link>
        </div>
      </div>
    );
  }




  const primaryVariant =
    tile.variants?.find((variant) => variant.active) ?? tile.variants?.[0];
  const productPath = `/products/${tile.slug ?? id}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tile.name,
    description: tile.description,
    image: tile.image ? absolutizeUrl(tile.image) : undefined,
    sku: primaryVariant?.sku,
    brand: { "@type": "Brand", name: siteConfig.siteName },
    ...(primaryVariant
      ? {
        offers: {
          "@type": "Offer",
          url: new URL(productPath, siteConfig.siteUrl).toString(),
          priceCurrency: primaryVariant.currency,
          price: String(primaryVariant.pricePerSqm),
          sku: primaryVariant.sku,
          ...(primaryVariant.inventory
            ? {
              availability:
                primaryVariant.inventory.onHandSqm >
                  primaryVariant.inventory.reservedSqm
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            }
            : {}),
        },
      }
      : {}),
    ...(reviews?.total && reviews.averageRating !== null
      ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: reviews.averageRating,
          reviewCount: reviews.total,
          bestRating: 5,
          worstRating: 1,
        },
        review: reviews.reviews.map((review) => ({
          "@type": "Review",
          name: review.title || undefined,
          reviewBody: review.body,
          datePublished: review.createdAt,
          reviewRating: {
            "@type": "Rating",
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 1,
          },
          author: { "@type": "Person", name: review.author },
        })),
      }
      : {}),
  };
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        { label: tile.name, href: productPath },

      ]} />
      <div className="min-h-screen bg-background">

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">

            {/* ── LEFT — tile image ──────────────────────────────────── */}
            <div>
              <div className="relative aspect-square overflow-hidden border border-border bg-muted shadow-sm">
                {tile.image ? (
                  <Image
                    src={tile.image}
                    alt={tile.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority

                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <svg className="size-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18V6z" />
                    </svg>
                  </div>
                )}
                {tile.badge && (
                  <Badge className={`absolute left-0 top-4 h-auto rounded-none px-4 py-1.5 text-xs font-bold tracking-wider uppercase ${badgeStyle(tile.badge)}`}>
                    {tile.badge}
                  </Badge>
                )}
              </div>

              {/* Color swatches */}
              {tile.colors.length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Colors</span>
                  <div className="flex gap-2">
                    {tile.colors.map((c, i) => (
                      <span
                        key={i}
                        title={c}
                        role="img"
                        aria-label={c}
                        className="size-6 border border-border shadow-sm"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT — tile info ──────────────────────────────────── */}
            <div className="space-y-6">

              {/* Category + name */}
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  {tile.categoryLabel}
                </span>
                <h1 className="font-playfair text-3xl font-bold leading-tight sm:text-4xl">
                  {tile.name}
                </h1>
              </div>

              {/* Description */}
              {tile.description && (
                <p className="text-base leading-relaxed text-muted-foreground">{tile.description}</p>
              )}

              {/* Specs grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tile.sizes && (
                  <div className="border border-border p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sizes</p>
                    <p className="text-sm font-semibold">{tile.sizes}</p>
                  </div>
                )}
                {tile.useCase && (
                  <div className="border border-border p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Use Case</p>
                    <p className="text-sm font-semibold">{tile.useCase}</p>
                  </div>
                )}
                <div className="border border-border p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</p>
                  <p className="text-sm font-semibold">{tile.categoryLabel}</p>
                </div>
                {tile.featured && (
                  <div className="bg-primary/10 p-4 border border-primary/20">
                    <p className="text-[10px] font-bold  uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-semibold text-primary">⭐ Featured</p>
                  </div>
                )}
              </div>

              {/* ── Collection card ──────────────────────────────────── */}
              {tile.collections?.length ? (
                tile.collections.map((collection, idx) => {
                  return <div className="border border-border bg-muted/20 p-5" key={collection.id ?? idx}>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Part of Collection</p>
                    <Link
                      href={`/collections#col-${collection.id}`}
                      className="group flex items-center gap-4"
                    >
                      {/* Collection thumbnail */}
                      <div className="relative w-16 h-16 shrink-0 overflow-hidden bg-background">
                        {collection.image ? (
                          <Image
                            src={collection.image}
                            alt={collection.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="64px"

                          />
                        ) : (
                          <div className="w-full h-full  flex items-center justify-center">
                            <svg className="w-6 h-6 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                          {collection.name}
                        </p>
                        {collection.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{collection.description}</p>
                        )}
                        {collection.tileIds && <p className=" text-xs mt-1">
                          {collection.tileIds.length} tile{collection.tileIds.length !== 1 ? "s" : ""} in this collection
                        </p>}
                      </div>
                      <svg className="w-4 h-4  shrink-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    {/* Other tiles in the collection */}
                    {collection.items?.length ? (
                      <div className="mt-4 pt-4 border-t border-border/10">
                        <p className="text-[10px]  uppercase tracking-wider font-semibold mb-2">
                          Also in this collection
                        </p>
                        <div className="flex gap-2">
                          {collection.items.map((item) => {
                            const t = item.product
                            return <Link
                              key={t.id}
                              href={`/products/${t.slug ?? t.id}`}
                              title={t.name}
                              className="relative w-12 h-12 shrink-0 overflow-hidden  hover:ring-2 hover:ring-primary transition-all"
                            >
                              {t.image ? (
                                <Image
                                  src={t.image}
                                  alt={t.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"

                                />
                              ) : (
                                <div className="w-full h-full " />
                              )}
                            </Link>
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                })
              ) : (
                <div className="bg-muted p-4 border border-border">
                  <p className="text-xs ">This tile is not part of a named collection.</p>
                </div>
              )}

              <ProductPurchase
                product={tile}
                className="space-y-5 border border-border bg-background p-5"
              />

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <WishlistButton productId={tile.id} />
                <Link
                  href={`/visualizer?tile=${tile.id}&autoApply=1&surface=${tile.category === "wall" || tile.category === "special" ? "wall" : "floor"}`}
                  className="flex flex-1 items-center justify-center gap-2 bg-secondary px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Visualize in Room
                </Link>
                <Link href="/contact" className="flex-1">
                  <Button variant="outline" className="h-full w-full px-6 py-4 text-sm font-bold uppercase tracking-widest">
                    Get a Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <ProductReviews productId={tile.id} initialData={reviews ?? undefined} />

          {/* ── Related tiles ──────────────────────────────────────────── */}
          {tile.related && tile.related.length > 0 && (
            <div className="mt-20 pt-14 border-t border-border">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-playfair text-2xl font-bold ">
                  More {tile.categoryLabel}
                </h2>
                <Link href={`/catalogue?category=${tile.category}`} className=" text-sm font-semibold hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {tile.related.map((r) => {
                  const rIsLocal = r.image.startsWith("/uploads/") || r.image.startsWith("data:");
                  return (
                    <Link
                      key={r.id}
                      href={`/products/${r.slug ?? r.id}`}
                      className=" group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative h-44 overflow-hidden ">
                        {r.image ? (
                          <Image
                            src={r.image}
                            alt={r.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, 25vw"

                          />
                        ) : (
                          <div className="absolute inset-0  flex items-center justify-center">
                            <svg className="w-8 h-8 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>
                          </div>
                        )}
                        {r.badge && (
                          <Badge className={`absolute left-0 top-2 h-auto rounded-none px-2.5 py-0.5 text-[9px] font-bold ${badgeStyle(r.badge)}`}>{r.badge}</Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <p className=" text-[9px] font-bold uppercase tracking-widest mb-0.5">{r.categoryLabel}</p>
                        <p className="text-sm font-bold transition-colors group-hover:text-primary">{r.name}</p>
                        <p className=" text-xs mt-0.5">{r.sizes}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>

  );
}
