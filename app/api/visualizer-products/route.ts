import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const parseColors = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

// ── GET /api/products ─────────────────────────────────────────────────────────
// Returns all products (no pagination, no filters)
export async function GET() {
  try {
    const rows = await prisma.product.findMany({
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
            containerPricePerSqm: true,
            sqmPerContainer: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const products = rows.map((p) => ({
      ...p,
      colors: parseColors(p.colors),
      variants: p.variants.map((v) => ({
        ...v,
        pricePerSqm: Number(v.pricePerSqm),
        pricePerBox: Number(v.pricePerBox),
        sqmPerBox: Number(v.sqmPerBox),
        thicknessMm: v.thicknessMm != null ? Number(v.thicknessMm) : null,
        weightKgPerBox:
          v.weightKgPerBox != null ? Number(v.weightKgPerBox) : null,
        compareAtPrice:
          v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
        containerPricePerSqm:
          v.containerPricePerSqm != null
            ? Number(v.containerPricePerSqm)
            : null,
        sqmPerContainer:
          v.sqmPerContainer != null ? Number(v.sqmPerContainer) : null,
      })),
    }));

    return NextResponse.json({
      products,
      total: products.length,
    });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
