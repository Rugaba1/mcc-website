import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productData, uniqueSlug } from "@/lib/products/payload";
import { withPermission } from "@/lib/middleware/withPermission";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { PERM } from "@/lib/permissions/catalog";

// ── GET /api/products/:id ─────────────────────────────────────────────────────

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 120,
})(async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params!;
    const numId = Number(id);

    const product = await prisma.product.findFirst({
      where: Number.isSafeInteger(numId) && numId > 0 ? { id: numId } : { slug: id },

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
            containerPricePerSqm: true,
            sqmPerContainer: true,
            currency: true,
            image: true,
            textureUrl: true,
            active: true,
          },
        },
        collections: {
          select: {
            collection: {
              include: {
                items: {
                  select: {
                    id: true,
                    collectionId: true,
                    productId: true,
                    product: {
                      select: { id: true, name: true, slug: true, image: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!product)
      return NextResponse.json(
        {
          error: "Product not found",
        },
        { status: 404 },
      );
    const related = await prisma.product.findMany({
      where: { collection: product.collection, id: { notIn: [product.id] } },
      take: 4,
      select: { id: true, name: true, slug: true, image: true },
    });

    const productRes = {
      ...product,
      collections: product.collections.map(({ collection }) => ({
        ...collection,
        tileIds: collection.items.map((item) => item.productId),
        items: collection.items.filter((item) => item.productId !== product.id),
      })),
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
            containerPricePerSqm:
              v.containerPricePerSqm != null
                ? Number(v.containerPricePerSqm)
                : null,
            sqmPerContainer:
              v.sqmPerContainer != null ? Number(v.sqmPerContainer) : null,
          }))
        : [],
    };
    return NextResponse.json(productRes);
  } catch (err: unknown) {
    console.error("GET /api/products/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
});
export const PUT = withPermission(PERM.PRODUCTS_UPDATE)(
  async (req: NextRequest, context) => {
  try {
    const { id } = await context.params!;
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
  },
);

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
export const DELETE = withPermission(PERM.PRODUCTS_DELETE)(
  async (_req: NextRequest, context) => {
  try {
    const { id } = await context.params!;
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
  },
);
