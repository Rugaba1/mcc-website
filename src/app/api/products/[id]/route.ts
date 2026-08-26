import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── PUT /api/products/:id ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name:          body.name,
        category:      body.category,
        categoryLabel: body.categoryLabel,
        description:   body.description,
        sizes:         body.sizes         ?? "",
        badge:         body.badge         ?? null,
        gradient:      body.gradient      ?? "",
        image:         body.image         ?? "",
        colors:        JSON.stringify(body.colors ?? []),
        useCase:       body.useCase       ?? "",
        collection:    body.collection    ?? "",
        featured:      body.featured      ?? false,
      },
    });
    return NextResponse.json({ ...product, colors: JSON.parse(product.colors) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
