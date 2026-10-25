import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/middleware/withRateLimit";

// ── GET /api/products ─────────────────────────────────────────────────────────
export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (_req: NextRequest) => {
  try {
    const rows = await prisma.product.count();

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
});
