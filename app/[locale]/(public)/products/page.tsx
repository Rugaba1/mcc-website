
import Image from "next/image";
import Link from "next/link";
import { serverApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/add-cart-button";
import { PaginationControls } from "@/components/pagination-controls";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { WishlistButton } from "@/components/wishlist-button";

const filters = [
    { key: "all", label: "All Collections" },
    { key: "floor", label: "Floor Tiles" },
    { key: "wall", label: "Wall Tiles" },
    { key: "outdoor", label: "Outdoor" },
    { key: "special", label: "Special Finish" },
];

const PAGE_SIZE = 12;

export default async function Products({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ category?: string, search?: string; page?: string; }>;
}) {

    const { category, page: pageParam, search } = await searchParams;
    const page = Math.max(1, parseInt(pageParam ?? "1", PAGE_SIZE) || 1);
    let totalPages = 1;
    let products = null
    try {
        const data = (await serverApi.getProducts({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, category: encodeURIComponent(category || "") }))
        products = data.products

        totalPages = data.totalPages

    } catch (error) {

    }

    if (!products) {
        return (
            <div className="min-h-screen  flex items-center justify-center">
                <div className="text-center">
                    <p className=" font-semibold text-lg">Tiles not found</p>
                    <Link href="/catalogue" className=" hover:underline text-sm mt-2 inline-block">
                        ← Back to home
                    </Link>
                </div>
            </div>
        );
    }







    return (<> <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
    
        ]} />

        <section id="products" className="h-full">
            <div className="max-w-7xl mx-auto ">
                <div className="max-w-7xl mx-auto text-center py-5">
                    <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
                        <span className="w-8 h-px bg-primary" />
                        Our Collections
                        <span className="w-8 h-px bg-primary" />
                    </span>
                    <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
                        Tiles for Every<br />Space &amp; Style
                    </h1>
                    <p className=" text-lg max-w-2xl mx-auto">
                        From classic ceramics to modern large-format porcelain — covering every design vision.
                    </p>
                </div>


                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2 mb-12 border-b border-border pb-6 justify-center pt-10">
                    {filters.map((f) => (
                        <Link href={`/products?category=${f.key}`} key={f.key}>
                            <Button
                                className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${category === f.key
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-background text-foreground border border-border hover:bg-muted"
                                    }`}
                            >
                                {f.label}
                            </Button></Link>
                    ))}
                </div>

                {/* Product grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((p) => (
                        < div
                            className=" group overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 block"
                        >
                            {/* Image */}
                            <div className="relative h-56 overflow-hidden ">
                                <Image
                                    src={p.image}
                                    alt={p.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    unoptimized
                                />
                                {/* Hover overlay with dual actions */}
                                <div className="absolute inset-0 bg-inverse/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-4">
                                    <Link
                                        href={`/visualizer?tile=${p.id}&autoApply=1&surface=${p.category === "wall" || p.category === "special" ? "wall" : "floor"}`}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 uppercase tracking-wider  shadow flex items-center gap-1.5 transition-transform hover:scale-105"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span>Visualize in Room</span>
                                    </Link>
                                    <Link
                                        href={`/products/${p.slug ?? p.id}`}
                                        className="bg-background/90 hover:bg-background text-foreground text-xs font-medium px-3.5 py-1.5 uppercase tracking-wider border border-border transition-colors"
                                    >
                                        View Details
                                    </Link>
                                </div>
                                {/* Badge */}
                                {p.badge && (
                                    <Badge className={`absolute left-0 top-4 h-auto rounded-none px-4 py-1.5 text-xs font-bold tracking-wider uppercase ${p.badge === "New" ? "bg-success text-success-foreground"
                                        : p.badge === "Premium" ? "bg-accent text-accent-foreground"
                                            : "bg-primary text-primary-foreground"
                                        }`}>
                                        {p.badge}
                                    </Badge>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-6 border-t border-border bg-card">
                                <span className=" text-[10px] font-bold tracking-[0.25em] uppercase mb-2 block">
                                    {p.categoryLabel}
                                </span>
                                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                                    {p.name}
                                </h3>
                                <p className=" text-sm leading-relaxed mb-5 line-clamp-2">{p.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <AddToCartButton product={p} sm /> <WishlistButton productId={p.id} />
                                    <span className=" text-xs font-medium">{p.sizes}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            {p.colors.map((c, i) => (
                                                <span
                                                    key={i}
                                                    title={c}
                                                    className="w-4 h-4 rounded-full border border-border shadow-sm"
                                                    style={{ background: c }}
                                                />
                                            ))}
                                        </div>
                                        <Link
                                            href={`/visualizer?tile=${p.id}&autoApply=1&surface=${p.category === "wall" || p.category === "special" ? "wall" : "floor"}`}
                                            className="text-primary hover:underline text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
                                            title="Visualize in room"
                                        >
                                            Visualizer
                                        </Link>
                                        <Link
                                            key={p.id}
                                            href={`/products/${p.slug ?? p.id}`}
                                        >
                                            <span className="text-[10px] font-bold  uppercase tracking-wider whitespace-nowrap">
                                                View →
                                            </span>
                                        </Link>

                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    basePath="/products"
                    prevLabel={"Previous"}
                    nextLabel={"Next"}
                    pageLabel={`Page of ${page}/${totalPages}`}
                    extraQuery={{ ...(category ? { category } : {}), ...(page ? { page: String(page) } : {}), ...(search ? { search: search } : {}) }}
                />


            </div>


        </section>
    </>
    );
}
