import { NextResponse } from "next/server";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { buildInventoryReport } from "@/lib/reports/report-data";
import {
  renderReport,
  reportDownload,
  requestedFormat,
} from "@/lib/reports/export";

export const runtime = "nodejs";

export const GET = withPermission([
  PERM.REPORTS_VIEW,
  PERM.INVENTORY_VIEW,
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
    const report = await buildInventoryReport();
    const buffer = await renderReport(report, format);
    return reportDownload(buffer, format, "inventory-position");
  } catch (error) {
    console.error("Inventory report export failed:", error);
    return NextResponse.json(
      { error: "Unable to export the inventory report." },
      { status: 500 },
    );
  }
});
