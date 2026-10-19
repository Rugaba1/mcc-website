import { prisma } from "@/lib/prisma";

export const STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);

/** "carrara-marble", then "carrara-marble-2", … ignoring the product being edited. */
export async function uniqueSlug(base: string, excludeId?: number) {
  const root = slugify(base) || "product";
  let slug = root;
  let n = 1;
  while (await prisma.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } })) {
    slug = `${root}-${++n}`;
  }
  return slug;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function productData(body: Record<string, any>) {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    name: body.name ?? "",
    category: body.category ?? "floor",
    categoryLabel: body.categoryLabel ?? "",
    description: body.description ?? "",
    sizes: body.sizes ?? "",
    badge: body.badge ?? null,
    gradient: body.gradient ?? "",
    image: body.image ?? "",
    colors: JSON.stringify(body.colors ?? []),
    useCase: body.useCase ?? "",
    collection: body.collection ?? "",
    featured: !!body.featured,
    material: str(body.material),
    origin: str(body.origin),
    slipRating: str(body.slipRating),
    waterAbsorption: str(body.waterAbsorption),
    isRectified: !!body.isRectified,
    status: STATUSES.includes(body.status) ? (body.status as (typeof STATUSES)[number]) : "ACTIVE",
    seoTitle: str(body.seoTitle),
    seoDescription: str(body.seoDescription),
  };
}