import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/products ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const rows = await prisma.product.findMany({ orderBy: { id: "asc" } });
    const products = rows.map((p) => ({
      ...p,
      colors: JSON.parse(p.colors || "[]"),
    }));
    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// ── POST /api/products ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
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
    return NextResponse.json({ ...product, colors: JSON.parse(product.colors) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
