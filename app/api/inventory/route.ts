import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireStaff } from "../../../lib/auth/require-staff";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error } = await requireStaff(request);
  if (error) return error;

  try {
    const variants = await prisma.productVariant.findMany({
      orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
      include: {
        product: { select: { id: true, name: true } },
        inventory: true,
      },
    });

    // Stock is in m². Prisma returns Decimals, so convert to numbers for JSON.
    return NextResponse.json(
      variants.map((v) => ({
        id: v.id,
        productId: v.product.id,
        productName: v.product.name,
        sku: v.sku,
        size: v.size,
        finish: v.finish,
        color: v.color,
        stockSqm: Number(v.inventory?.onHandSqm ?? 0),
        reservedSqm: Number(v.inventory?.reservedSqm ?? 0), // held by unpaid orders
        lowStockThreshold: Number(v.inventory?.reorderLevel ?? 0),
      })),
    );
  } catch (e) {
    console.error("Inventory list error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
