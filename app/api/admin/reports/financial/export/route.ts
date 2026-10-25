import { NextResponse } from "next/server";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import {
  buildFinancialReport,
  ReportValidationError,
} from "@/lib/reports/report-data";
import {
  renderReport,
  reportDownload,
  requestedFormat,
} from "@/lib/reports/export";

export const runtime = "nodejs";

export const GET = withPermission([
  PERM.REPORTS_VIEW,
  PERM.REPORTS_FINANCIAL,
  PERM.ORDERS_VIEW,
  PERM.PAYMENTS_VIEW,
  PERM.REPORTS_EXPORT,
])(async (request) => {
  const format = requestedFormat(request.nextUrl.searchParams.get("format"));
  if (!format) {
    return NextResponse.json(
      { error: "Choose csv, xlsx, or pdf as the export format." },
      { status: 400 },
    );
  }
  try {
    const report = await buildFinancialReport(request.nextUrl.searchParams);
    const buffer = await renderReport(report, format);
    return reportDownload(buffer, format, "financial-activity");
  } catch (error) {
    if (error instanceof ReportValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Financial report export failed:", error);
    return NextResponse.json(
      { error: "Unable to export the financial activity report." },
      { status: 500 },
    );
  }
});
