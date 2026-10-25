import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { PERM } from "@/lib/permissions/catalog";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

// Only what a collection card needs. The old `product: true` pulled every column
// (description, gradient, colors, image...) of every product in every collection.
const PRODUCT_CARD = {
  id: true,
  name: true,
  slug: true,
  image: true,
  category: true,
  categoryLabel: true,
  badge: true,
  featured: true,
} satisfies Prisma.ProductSelect;

// ── GET /api/collections ──────────────────────────────────────────────────────
export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (req: NextRequest) => {
  try {
    const pagination = parsePagination(req.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    const where: Prisma.CollectionWhereInput = pagination.search
      ? {
          OR: [
            { name: { contains: pagination.search } },
            { description: { contains: pagination.search } },
          ],
        }
      : {};
    let total = 0;
    let page = pagination.page;
    if (pagination.requested) {
      total = await prisma.collection.count({ where });
      page = pageForTotal(total, pagination.page, pagination.pageSize).page;
    }
    const rows = await prisma.collection.findMany({
      where,
      orderBy: { id: "asc" },
      ...(pagination.requested
        ? { skip: (page - 1) * pagination.pageSize, take: pagination.pageSize }
        : {}),
      include: {
        items: {
          select: {
            id: true,
            collectionId: true,
            productId: true,
            product: { select: PRODUCT_CARD },
          },
        },
      },
    });

    const collections = rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      featured: c.featured,
      tileIds: c.items.map((i) => i.productId),
      items: c.items,
    }));

    return NextResponse.json(
      pagination.requested
        ? paginatedResult(collections, total, page, pagination.pageSize)
        : collections,
    );
  } catch (err) {
    console.error("GET /api/collections error:", err);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 },
    );
  }
});

// ── POST /api/collections ─────────────────────────────────────────────────────
export const POST = withPermission(PERM.COLLECTIONS_MANAGE)(
  async (req: NextRequest) => {
  try {
    const body = await req.json();
    const collection = await prisma.collection.create({
      data: {
        name: body.name,
        description: body.description ?? "",
        image: body.image ?? "",
        featured: body.featured ?? false,
        items: {
          create: (body.tileIds ?? []).map((pid: number) => ({
            productId: pid,
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json(
      { ...collection, tileIds: collection.items.map((i) => i.productId) },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/collections error:", err);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 },
    );
  }
  },
);
