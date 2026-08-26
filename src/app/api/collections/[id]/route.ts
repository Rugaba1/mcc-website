import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── PUT /api/collections/:id ──────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const numId = Number(id);

    // Replace all items (delete + recreate)
    await prisma.collectionItem.deleteMany({ where: { collectionId: numId } });

    const collection = await prisma.collection.update({
      where: { id: numId },
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
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

// ── DELETE /api/collections/:id ───────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.collection.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
