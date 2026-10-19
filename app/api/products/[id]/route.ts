import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productData, uniqueSlug } from "@/lib/products/payload";
import { requireStaff } from "@/lib/auth/require-staff";

// ── GET /api/products/:id ─────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log(id);
    const numId = Number(id);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const product = await prisma.product.findFirst({
      where: Number.isNaN(Number(id)) ? { slug: id } : { id: Number(id) },

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
          },
        },
        collections: {
          select: {
            collection: {
              include: { items: { include: { product: true } } },
            },
          },
        },
      },
    });
    console.log(product);
    if (!product)
      return NextResponse.json(
        {
          error: "Product not",
        },
        { status: 404 },
      );
    const related = await prisma.product.findMany({
      where: { collection: product.collection, id: { notIn: [product.id] } },
      take: 4,
    });

    const productRes = {
      ...product,
      related: related,

      colors:
        typeof product.colors === "string"
          ? JSON.parse(product.colors || "[]")
          : product.colors || [],
      variants: product.variants
        ? product.variants.map((v) => ({
            ...v,
            pricePerSqm: Number(v.pricePerSqm),
            pricePerBox: Number(v.pricePerBox),
            sqmPerBox: Number(v.sqmPerBox),
            thicknessMm: v.thicknessMm ? Number(v.thicknessMm) : null,
            weightKgPerBox: v.weightKgPerBox ? Number(v.weightKgPerBox) : null,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          }))
        : [],
    };
    return NextResponse.json({
      ...productRes,
      colors: JSON.parse(product.colors),
    });
  } catch (err: unknown) {
    console.error("GET /api/products/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireStaff(req);
    if (error) return error;
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const product = await prisma.product.update({
      where: { id: numId },
      data: {
        ...productData(body),
        ...(body.slug ? { slug: await uniqueSlug(body.slug, numId) } : {}),
      },
    });
    return NextResponse.json({
      ...product,
      colors: JSON.parse(product.colors),
    });
  } catch (err: unknown) {
    console.error("PUT /api/products/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/products/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
