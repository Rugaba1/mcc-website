import { NextResponse } from "next/server";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { buildInventoryReport } from "@/lib/reports/report-data";

export const GET = withPermission([
  PERM.REPORTS_VIEW,
  PERM.INVENTORY_VIEW,
])(async () => {
  try {
    const report = await buildInventoryReport();
    return NextResponse.json(report, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Inventory report generation failed:", error);
    return NextResponse.json(
      { error: "Unable to generate the inventory report." },
      { status: 500 },
    );
  }
});
