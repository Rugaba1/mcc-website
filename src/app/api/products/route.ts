import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/products ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: any = {};
    if (category && category !== "all") {
      where.category = category;
    }
    if (status && status !== "all") {
      where.status = status;
    }

    const rows = await prisma.product.findMany({
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
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const products = rows.map((p) => ({
      ...p,
      colors:
        typeof p.colors === "string"
          ? JSON.parse(p.colors || "[]")
          : p.colors || [],
      variants: p.variants
        ? p.variants.map((v) => ({
            ...v,
            pricePerSqm: Number(v.pricePerSqm),
            pricePerBox: Number(v.pricePerBox),
            sqmPerBox: Number(v.sqmPerBox),
            thicknessMm: v.thicknessMm ? Number(v.thicknessMm) : null,
            weightKgPerBox: v.weightKgPerBox ? Number(v.weightKgPerBox) : null,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          }))
        : [],
    }));
    return NextResponse.json(products);
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// ── POST /api/products ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        category: body.category,
        categoryLabel: body.categoryLabel,
        description: body.description,
        sizes: body.sizes ?? "",
        badge: body.badge ?? null,
        gradient: body.gradient ?? "",
        image: body.image ?? "",
        colors: JSON.stringify(body.colors ?? []),
        useCase: body.useCase ?? "",
        collection: body.collection ?? "",
        featured: body.featured ?? false,
      },
    });
    return NextResponse.json(
      { ...product, colors: JSON.parse(product.colors) },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
