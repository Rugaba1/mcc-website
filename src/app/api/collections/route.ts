import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/collections ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const rows = await prisma.collection.findMany({
      orderBy: { id: "asc" },
      include: {
        items: { include: { product: true } },
      },
    });
    const collections = rows.map((c) => ({
      id:          c.id,
      name:        c.name,
      description: c.description,
      image:       c.image,
      featured:    c.featured,
      tileIds:     c.items.map((i) => i.productId),
    }));
    return NextResponse.json(collections);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

// ── POST /api/collections ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const collection = await prisma.collection.create({
      data: {
        name:        body.name,
        description: body.description ?? "",
        image:       body.image       ?? "",
        featured:    body.featured    ?? false,
        items: {
          create: (body.tileIds ?? []).map((pid: number) => ({ productId: pid })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({
      ...collection,
      tileIds: collection.items.map((i) => i.productId),
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
