import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const PAGE_SIZE = 12;
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || String(PAGE_SIZE));
    const page = parseInt(searchParams.get("page") || "1");
    const query = searchParams.get("search");
    const skip = (page - 1) * limit;
    const category = searchParams.get("category");
    const type = searchParams.get("type");

    const where: any = {};
    if (category && category !== "all") {
      where.category = category;
    }
    // if (type && type !== "all" && type!==undefined) {
    //   where.type = type;
    // }

    if (query && query != undefined) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { colors: { contains: query, mode: "insensitive" } },
        { usecase: { contains: query, mode: "insensitive" } },
        { collection: { contains: query, mode: "insensitive" } },
        { material: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { sizes: { contains: query, mode: "insensitive" } },
      ];
    }
    const total = await prisma.product.count({ where });

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
        projects: true,
      },
      take: PAGE_SIZE,
      skip:0,
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
    const all = await prisma.product.count();
    return NextResponse.json({
      products,
      totalPages: Math.ceil(total / limit),
    });
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
