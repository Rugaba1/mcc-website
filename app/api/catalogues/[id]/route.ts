import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withPermission(PERM.CATALOGUES_MANAGE)(
  async (req: NextRequest, { params }: Ctx) => {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const row = await prisma.catalogue.update({
      where: { id: numId },
      data: {
        title: body.title?.trim() ?? undefined,
        description: body.description ?? undefined,
        coverImage: body.coverImage ?? undefined,
        fileUrl: body.fileUrl ?? undefined,
        category: body.category ?? undefined,
        year: body.year ?? undefined,
        published: body.published ?? undefined,
        featured: body.featured ?? undefined,
      },
    });
    return NextResponse.json(row);
  } catch (err: unknown) {
    console.error("PUT /api/catalogues/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json(
        { error: "Catalogue not found" },
        { status: 404 },
      );
    return NextResponse.json(
      { error: "Failed to update catalogue" },
      { status: 500 },
    );
  }
  },
);

export const DELETE = withPermission(PERM.CATALOGUES_MANAGE)(
  async (_req: NextRequest, { params }: Ctx) => {
  try {
    const { id } = await params;
    await prisma.catalogue.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/catalogues/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json(
        { error: "Catalogue not found" },
        { status: 404 },
      );
    return NextResponse.json(
      { error: "Failed to delete catalogue" },
      { status: 500 },
    );
  }
});
