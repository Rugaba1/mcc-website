import { NextRequest, NextResponse } from "next/server";

import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { prisma } from "@/lib/prisma";

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 120,
})(async (_request: NextRequest) => {
  const now = new Date();
  try {
    const publications = await prisma.publication.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(publications, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("GET /api/publications failed:", error);
    return NextResponse.json({ error: "Could not load publications" }, { status: 500 });
  }
});
