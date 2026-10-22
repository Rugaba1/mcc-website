import Image from "next/image";
import Link from "next/link";
import { serverApi, type Product } from "../lib/api";
import { Button } from "./ui/button";
import AddToCartButton from "./add-cart-button";
import { WishlistButton } from "./wishlist-button";


const filters = [
  { key: "all", label: "All Collections" },
  { key: "floor", label: "Floor Tiles" },
  { key: "wall", label: "Wall Tiles" },
  { key: "outdoor", label: "Outdoor" },
  { key: "special", label: "Special Finish" },
];

const PAGE_SIZE = 12;

export default async function Products() {

  const page = 1
  let totalPages = 1;
  let products = null
  try {
    const data = (await serverApi.getProducts({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, category: encodeURIComponent("") }))
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





  return (
    <section id="products" className="py-24 ">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
              <span className="gold-divider" />
              Our Collections
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold  leading-tight">
              Tiles for Every<br />Space &amp; Style
            </h2>
          </div>
          <p className=" text-base max-w-sm leading-relaxed md:text-right">
            From classic ceramics to modern large-format porcelain — covering every design vision.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-12 -b -gray-200 pb-6">
          {filters.map((f) => (
            <Link href={`/products?category=${f.key}`} key={f.key}>
              <Button
                className={`px-5 py-2 text-sm font-semibold transition-all duration-200  `}
              >
                {f.label}
              </Button></Link>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p: Product) => (
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
                <div className="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-4">
                  <Link
                    href={`/visualizer?tile=${p.id}&autoApply=1&surface=${p.category === "wall" || p.category === "special" ? "wall" : "floor"}`}
                    className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 uppercase tracking-wider  shadow flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Visualize in Room</span>
                  </Link>
                  <Link
                    href={`/products/${p.id}`}
                    className="bg-background/90 hover:bg-background text-ivory/80 text-xs font-medium px-3.5 py-1.5 uppercase tracking-wider  border transition-colors"
                  >
                    View Details
                  </Link>
                </div>
                {/* Badge */}
                {p.badge && (
                  <span className={`absolute top-4 left-0 text-xs font-bold px-4 py-1.5 tracking-wider uppercase ${p.badge === "New" ? "bg-emerald-500 "
                    : p.badge === "Premium" ? "bg-accent "
                      : "bg-primary "
                    }`}>
                    {p.badge}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-6 -t ">
                <span className=" text-[10px] font-bold tracking-[0.25em] uppercase mb-2 block">
                  {p.categoryLabel}
                </span>
                <h3 className="text-lg font-bold  mb-2 group-hover: transition-colors duration-200">
                  {p.name}
                </h3>
                <p className=" text-sm leading-relaxed mb-5 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between pt-4 -t ">
                  <AddToCartButton product={p} sm /> <WishlistButton productId={p.id} />
                  <span className=" text-xs font-medium">{p.sizes}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {p.colors.map((c: any, i: number) => (
                        <span
                          key={i}
                          title={c}
                          className="w-4 h-4 -full  -gray-200 shadow-sm"
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
                      href={`/products/${p.id}`}
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

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-14 pt-10 -t -gray-200">
          <p className=" text-sm">
            Showing <strong className="">{products.length}</strong> products.
            Full catalogue available on request.
          </p>
          <Link
            href="/catalogue"
            className="group bg-accent hover:bg-primary  font-bold px-9 py-4 transition-all duration-300 shadow-lg flex items-center gap-3 text-sm tracking-widest uppercase"
          >
            View Full Catalogue
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
