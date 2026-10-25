// src/app/api/locations/provinces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProvinces } from "@/lib/locations";
import { withRateLimit } from "@/lib/middleware/withRateLimit";

export const runtime = "nodejs";
const CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (_request: NextRequest) => {
  return NextResponse.json(getProvinces(), { headers: CACHE });
});
