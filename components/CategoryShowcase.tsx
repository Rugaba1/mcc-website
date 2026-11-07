
import { MediaImage } from "@/components/media-image";
import { Link } from "@/app/i18n/routing";
import { prisma } from "@/lib/prisma";

export default async function CategoryShowcase() {
  let categories: {
    key: string;
    title: string;
    subtitle: string;
    href: string;
    image: string | null;
  }[] = [];

  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ featured: "desc" }, { id: "asc" }],
      select: {
        category: true,
        categoryLabel: true,
        image: true,
        useCase: true,
      },
    });

    const grouped = new Map<string, typeof products>();
    for (const product of products) {
      const group = grouped.get(product.category) ?? [];
      group.push(product);
      grouped.set(product.category, group);
    }

    categories = Array.from(grouped, ([key, items]) => {
      const representative = items.find((item) => item.image.trim()) ?? items[0];
      return {
        key,
        title: representative.categoryLabel || key,
        subtitle:
          representative.useCase.trim() || `${items.length} products available`,
        href: `/catalogue?category=${encodeURIComponent(key)}`,
        image: items.find((item) => item.image.trim())?.image ?? null,
      };
    });
  } catch (error) {
    console.error("Failed to load homepage product categories:", error);
  }

  if (categories.length === 0) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-playfair text-4xl font-bold md:text-5xl">
            Browse by Category
          </h2>
          <p className="mt-4 text-muted-foreground">
            Product categories will appear here when active products are available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
            <span className="gold-divider" />
            Browse by Category
            <span className="gold-divider" />
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold">
            Find Your Perfect Tile
          </h2>
        </div>

        <div className="grid auto-rows-[minmax(240px,1fr)] grid-cols-2 gap-3 md:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.key}
              href={category.href}
              className={`category-card group relative min-h-60 overflow-hidden ${
                index === 0 ? "row-span-2" : ""
              }`}
            >
              {category.image ? (
                <MediaImage
                  src={category.image}
                  alt={category.title}
                  fill
                  className="category-img object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-inverse/85 via-inverse/20 to-transparent transition-all duration-300 group-hover:from-inverse/90" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em]">
                  {category.subtitle}
                </p>
                <h3 className="text-lg font-bold leading-tight md:text-xl">
                  {category.title}
                </h3>
                <div className="mt-2 flex translate-y-2 items-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="text-xs font-semibold uppercase tracking-wider">Browse</span>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="absolute right-4 top-4 h-8 w-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="absolute right-0 top-0 h-px w-full bg-primary" />
                <span className="absolute right-0 top-0 h-full w-px bg-primary" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
