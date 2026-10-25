import { NextResponse } from "next/server";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import {
  buildFinancialReport,
  ReportValidationError,
} from "@/lib/reports/report-data";

export const GET = withPermission([
  PERM.REPORTS_VIEW,
  PERM.REPORTS_FINANCIAL,
  PERM.ORDERS_VIEW,
  PERM.PAYMENTS_VIEW,
])(async (request) => {
  try {
    const report = await buildFinancialReport(request.nextUrl.searchParams);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof ReportValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Financial report generation failed:", error);
    return NextResponse.json(
      { error: "Unable to generate the financial activity report." },
      { status: 500 },
    );
  }
});
