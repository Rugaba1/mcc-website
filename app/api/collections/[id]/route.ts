import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

// ── PUT /api/collections/:id ──────────────────────────────────────────────────
export const PUT = withPermission(PERM.COLLECTIONS_MANAGE)(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const numId = Number(id);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    // Atomic: delete old items + update collection in a single transaction
    const [, collection] = await prisma.$transaction([
      prisma.collectionItem.deleteMany({ where: { collectionId: numId } }),
      prisma.collection.update({
        where: { id: numId },
        data: {
          name: body.name ?? "",
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
      }),
    ]);

    return NextResponse.json({
      ...collection,
      tileIds: collection.items.map((i) => i.productId),
    });
  } catch (err: unknown) {
    console.error("PUT /api/collections/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 },
    );
  }
  },
);

// ── DELETE /api/collections/:id ───────────────────────────────────────────────
export const DELETE = withPermission(PERM.COLLECTIONS_MANAGE)(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
  try {
    const { id } = await params;
    await prisma.collection.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/collections/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 },
    );
  }
  },
);
