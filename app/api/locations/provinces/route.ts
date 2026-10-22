// src/app/api/locations/provinces/route.ts
import { NextResponse } from "next/server";
import { getProvinces } from "@/lib/locations";

export const runtime = "nodejs";
const CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export function GET() {
  return NextResponse.json(getProvinces(), { headers: CACHE });
}
