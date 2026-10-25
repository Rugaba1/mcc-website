// src/app/api/locations/districts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDistricts } from "@/lib/locations";
import { withRateLimit } from "@/lib/middleware/withRateLimit";

export const runtime = "nodejs";
const CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (request: NextRequest) => {
  const province = request.nextUrl.searchParams.get("province")?.trim();
  if (!province) {
    return NextResponse.json(
      { error: "province is required" },
      { status: 400 },
    );
  }
  const rows = getDistricts(province);
  if (!rows)
    return NextResponse.json({ error: "Unknown province" }, { status: 404 });
  return NextResponse.json(rows, { headers: CACHE });
});
