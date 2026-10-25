import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { PERM } from "@/lib/permissions/catalog";
import { productData, uniqueSlug } from "@/lib/products/payload";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

/** Treats "", "undefined", "null" and "all" (what a sloppy client sends) as "no value". */
const clean = (v: string | null): string | undefined => {
  if (!v) return undefined;
  const t = v.trim();
  return t === "" || t === "undefined" || t === "null" || t === "all"
    ? undefined
    : t;
};

const toInt = (v: string | undefined, fallback: number) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const parseColors = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

// ── GET /api/products ─────────────────────────────────────────────────────────
// Supports: limit, page OR skip, search OR query, category, status, badge, sort
export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 120,
})(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams;

    const limit = Math.min(
      Math.max(toInt(clean(sp.get("limit")), DEFAULT_LIMIT), 1),
      MAX_LIMIT,
    );
    const page = Math.max(toInt(clean(sp.get("page")), 1), 1);
    const skipParam = clean(sp.get("skip"));
    const skip =
      skipParam !== undefined ? toInt(skipParam, 0) : (page - 1) * limit;

    const query = clean(sp.get("search")) ?? clean(sp.get("query"));
    const category = clean(sp.get("category"));
    const status = clean(sp.get("status"));
    const featured = clean(sp.get("featured"));
    const badge = clean(sp.get("badge"));
    const sort = clean(sp.get("sort"));

    const where: Prisma.ProductWhereInput = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (badge) where.badge = badge;
    if (featured === "true") where.featured = true;
    if (featured === "false") where.featured = false;

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "name"
        ? { name: "asc" }
        : sort === "category"
          ? { category: "asc" }
          : sort === "newest"
            ? { createdAt: "desc" }
            : { id: "asc" };

    if (query) {
      // MySQL collations are already case-insensitive, and Prisma's `mode: "insensitive"`
      // is not supported on MySQL (it throws), so it is intentionally not used here.
      where.OR = [
        { name: { contains: query } },
        { colors: { contains: query } },
        { useCase: { contains: query } },
        { collection: { contains: query } },
        { material: { contains: query } },
        { category: { contains: query } },
        { categoryLabel: { contains: query } },
        { description: { contains: query } },
        { sizes: { contains: query } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          variants: {
            where: { active: true },
            select: {
              id: true,
              productId: true,
              sku: true,
              size: true,
              finish: true,
              color: true,
              thicknessMm: true,
              shadeCode: true,
              piecesPerBox: true,
              sqmPerBox: true,
              weightKgPerBox: true,
              pricePerSqm: true,
              pricePerBox: true,
              compareAtPrice: true,
              currency: true,
              image: true,
              textureUrl: true,
              active: true,
              containerPricePerSqm: true,
              sqmPerContainer: true,
            },
          },
        },
        take: limit,
        skip,
        orderBy,
      }),
    ]);

    const products = rows.map((p) => ({
      ...p,
      colors: parseColors(p.colors),
      variants: p.variants.map((v) => ({
        ...v,
        pricePerSqm: Number(v.pricePerSqm),
        pricePerBox: Number(v.pricePerBox),
        sqmPerBox: Number(v.sqmPerBox),
        thicknessMm: v.thicknessMm != null ? Number(v.thicknessMm) : null,
        weightKgPerBox:
          v.weightKgPerBox != null ? Number(v.weightKgPerBox) : null,
        compareAtPrice:
          v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
        containerPricePerSqm:
          v.containerPricePerSqm != null ? Number(v.containerPricePerSqm) : null,
        sqmPerContainer:
          v.sqmPerContainer != null ? Number(v.sqmPerContainer) : null,
      })),
    }));

    return NextResponse.json({
      products,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
});

// ── POST /api/products ────────────────────────────────────────────────────────
export const POST = withPermission(PERM.PRODUCTS_CREATE)(
  async (req: NextRequest) => {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        ...productData(body),
        slug: await uniqueSlug(body.slug || body.name),
      },
    });
    return NextResponse.json(
      { ...product, colors: parseColors(product.colors) },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
  },
);
