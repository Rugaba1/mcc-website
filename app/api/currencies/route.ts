import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { getBaseCurrency, serializeCurrency } from "@/lib/currency";

export const runtime = "nodejs";

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 120,
})(async () => {
  try {
    const rows = await prisma.currency.findMany({
      orderBy: [{ isBase: "desc" }, { code: "asc" }],
    });
    const currencies = rows.map(serializeCurrency);
    const baseCurrency = getBaseCurrency(currencies);
    return NextResponse.json(
      {
        baseCurrency,
        currencies,
        availableCurrencies: currencies.filter((currency) => currency.enabled),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/currencies failed:", error);
    return NextResponse.json(
      { error: "Currency configuration is unavailable" },
      { status: 503 },
    );
  }
});
