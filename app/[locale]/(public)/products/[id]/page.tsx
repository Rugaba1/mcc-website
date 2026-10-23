
import Image from "next/image";
import Link from "next/link";
import { type Product, serverApi, type ProductReviewSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Metadata } from "next";
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { absolutizeUrl } from "@/lib/absolutize";
import { generateAlternateLinks } from "@/lib/alternates";
import AddToCartButton from "@/components/add-cart-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductReviews } from "@/components/products/product-reviews";

function badgeStyle(badge: Product["badge"]) {
  if (badge === "New") return "bg-emerald-500 ";
  if (badge === "Premium") return "bg-accent ";
  if (badge === "Bestseller") return "bg-primary ";
  return "";
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string, id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { id } = await params;

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
  const title = `${tile?.name ?? "Product"} | ${siteConfig.siteName}`;
  const description = `${tile?.description ?? ""}${reviewSummary}`.slice(0, 300);
  const url = `${seoConfig.siteUrl}${`/${locale}`}/products/${tile?.id}`;

  const thumb = tile?.image ? absolutizeUrl(tile?.image) : undefined;
  const image = thumb ?? `${seoConfig.siteUrl}/products/apollo-grey.jpg`;

  return {
    title,
    description,
    openGraph: {
      title, description, url, siteName: seoConfig.siteName, locale: locale.replace("-", "_"), type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: url, languages: generateAlternateLinks(locale, `/products/${tile?.id}`) },
    robots: { index: true, follow: true },
  };
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




  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tile.name,
    description: tile.description,
    image: tile.image ? absolutizeUrl(tile.image) : undefined,
    sku: tile.variants?.[0]?.sku,
    brand: { "@type": "Brand", name: siteConfig.siteName },
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        { label: tile.name, href: `/products/${id}` },

      ]} />
      <div className="min-h-screen ">



        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* ── LEFT — tile image ──────────────────────────────────── */}
            <div>
              <div className="relative aspect-square  shadow-lg overflow-hidden">
                {tile.image ? (
                  <Image
                    src={tile.image}
                    alt={tile.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0  flex items-center justify-center">
                    <svg className="w-16 h-16 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18V6z" />
                    </svg>
                  </div>
                )}
                {tile.badge && (
                  <span className={`absolute top-4 left-0 text-xs font-bold px-4 py-1.5 tracking-wider uppercase ${badgeStyle(tile.badge)}`}>
                    {tile.badge}
                  </span>
                )}
              </div>

              {/* Color swatches */}
              {tile.colors.length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs  font-semibold uppercase tracking-wider">Colors</span>
                  <div className="flex gap-2">
                    {tile.colors.map((c, i) => (
                      <span
                        key={i}
                        title={c}
                        className="w-6 h-6   shadow cursor-pointer hover:scale-110 transition-transform"
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
                <span className=" text-xs font-bold tracking-[0.25em] uppercase block mb-2">
                  {tile.categoryLabel}
                </span>
                <h1 className="font-playfair text-4xl font-bold  leading-tight">
                  {tile.name}
                </h1>
              </div>

              {/* Description */}
              {tile.description && (
                <p className=" text-base leading-relaxed">{tile.description}</p>
              )}

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-4">
                {tile.sizes && (
                  <div className=" p-4  ">
                    <p className="text-[10px] font-bold  uppercase tracking-wider mb-1">Sizes</p>
                    <p className="text-sm font-semibold ">{tile.sizes}</p>
                  </div>
                )}
                {tile.useCase && (
                  <div className=" p-4  ">
                    <p className="text-[10px] font-bold  uppercase tracking-wider mb-1">Use Case</p>
                    <p className="text-sm font-semibold ">{tile.useCase}</p>
                  </div>
                )}
                <div className=" p-4  ">
                  <p className="text-[10px] font-bold  uppercase tracking-wider mb-1">Category</p>
                  <p className="text-sm font-semibold ">{tile.categoryLabel}</p>
                </div>
                {tile.featured && (
                  <div className="bg-primary/10 p-4  -primary/20">
                    <p className="text-[10px] font-bold  uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-semibold text-primary">⭐ Featured</p>
                  </div>
                )}
              </div>

              {/* ── Collection card ──────────────────────────────────── */}
              {tile.collections ? (
                tile.collections.map((collection, idx) => {
                  return <div className="p-5" key={idx}>
                    <p className="text-[10px] font-bold  uppercase tracking-widest mb-3">Part of Collection</p>
                    <Link
                      href={`/collections#col-${collection.id}`}
                      className="flex items-center gap-4 group"
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
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full  flex items-center justify-center">
                            <svg className="w-6 h-6 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className=" font-bold text-base group-hover: transition-colors">
                          {collection.name}
                        </p>
                        {collection.description && (
                          <p className=" text-xs mt-0.5 line-clamp-2">{collection.description}</p>
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
                    {collection.items && collection.items.length > 0 && (
                      <div className="mt-4 pt-4 -t /10">
                        <p className="text-[10px]  uppercase tracking-wider font-semibold mb-2">
                          Also in this collection
                        </p>
                        <div className="flex gap-2">
                          {collection.items.map((item) => {
                            const t = item.product
                            return <Link
                              key={t.id}
                              href={`/products/${t.id}`}
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
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full " />
                              )}
                            </Link>
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                })
              ) : (
                <div className=" p-4  -gray-200">
                  <p className="text-xs ">This tile is not part of a named collection.</p>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <AddToCartButton product={tile} className="h-full font-bold py-8 px-6 text-sm tracking-widest uppercase text-center transition-colors flex items-center justify-center gap-2" /> <WishlistButton productId={tile.id} />
                <Link
                  href={`/visualizer?tile=${tile.id}&autoApply=1&surface=${tile.category === "wall" || tile.category === "special" ? "wall" : "floor"}`}
                  className="flex-1 bg-secondary hover:bg-secondary  font-bold py-4 px-6 text-sm tracking-widest uppercase text-center transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Visualize in Room
                </Link>
                <Link
                  href="/#contact"

                >
                  <Button variant={"outline"} className="flex-1 h-full font-bold py-8 px-6 text-sm tracking-widest uppercase text-center transition-colors">
                    Get a Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <ProductReviews productId={tile.id} />

          {/* ── Related tiles ──────────────────────────────────────────── */}
          {tile.related && tile.related.length > 0 && (
            <div className="mt-20 pt-14 -t -gray-200">
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
                      href={`/products/${r.id}`}
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
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0  flex items-center justify-center">
                            <svg className="w-8 h-8 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>
                          </div>
                        )}
                        {r.badge && (
                          <span className={`absolute top-2 left-0 text-[9px]  font-bold px-2.5 py-0.5 ${badgeStyle(r.badge)}`}>{r.badge}</span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className=" text-[9px] font-bold uppercase tracking-widest mb-0.5">{r.categoryLabel}</p>
                        <p className="font-bold  text-sm group-hover: transition-colors">{r.name}</p>
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
