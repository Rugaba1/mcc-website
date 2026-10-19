import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

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
export async function GET() {
  try {
    const rows = await prisma.collection.findMany({
      orderBy: { id: "asc" },
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

    return NextResponse.json(collections);
  } catch (err) {
    console.error("GET /api/collections error:", err);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 },
    );
  }
}

// ── POST /api/collections ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
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
}
