// src/app/api/locations/sectors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSectors } from "@/lib/locations";
import { withRateLimit } from "@/lib/middleware/withRateLimit";

export const runtime = "nodejs";
const CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (request: NextRequest) => {
  const p = request.nextUrl.searchParams;
  const province = p.get("province")?.trim();
  const district = p.get("district")?.trim();
  if (!province || !district) {
    return NextResponse.json(
      { error: "province and district are required" },
      { status: 400 },
    );
  }
  const rows = getSectors(province, district);
  if (!rows)
    return NextResponse.json(
      { error: "Unknown province or district" },
      { status: 404 },
    );
  return NextResponse.json(rows, { headers: CACHE });
});
