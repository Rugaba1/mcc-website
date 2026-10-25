"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage } from "@/lib/api";
import type { ReportFormat, ReportTable } from "@/lib/reports/report-data";
import { PERM } from "@/lib/permissions/catalog";
import { hasPermissions } from "@/lib/permissions/core";
import { useAuth } from "@/contexts/auth-context";
import { PermissionGate } from "@/components/permission-gate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ReportKind = "financial" | "inventory";

function localDate(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(() => {
    const date = new Date(now.getFullYear(), now.getMonth(), 1);
    return localDate(date);
  });
  const [to, setTo] = useState(() => localDate(now));
  const [kind, setKind] = useState<ReportKind>("financial");
  const [report, setReport] = useState<ReportTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<ReportFormat | null>(null);

  const canViewFinancial = Boolean(
    user &&
      hasPermissions(user.permissions, [
        PERM.REPORTS_VIEW,
        PERM.REPORTS_FINANCIAL,
        PERM.ORDERS_VIEW,
        PERM.PAYMENTS_VIEW,
      ]),
  );
  const canViewInventory = Boolean(
    user &&
      hasPermissions(user.permissions, [
        PERM.REPORTS_VIEW,
        PERM.INVENTORY_VIEW,
      ]),
  );

  useEffect(() => {
    if (kind === "financial" && !canViewFinancial && canViewInventory) {
      setKind("inventory");
      setReport(null);
    }
  }, [canViewFinancial, canViewInventory, kind]);

  async function generateReport() {
    setLoading(true);
    try {
      const result =
        kind === "financial"
          ? await api.getAdminFinancialReport(from, to)
          : await api.getAdminInventoryReport();
      setReport(result);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to generate report"));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function exportReport(format: ReportFormat) {
    setExporting(format);
    try {
      const blob = await api.downloadAdminReport(
        kind,
        format,
        kind === "financial" ? { from, to } : undefined,
      );
      const suffix = kind === "financial" ? `${from}-to-${to}` : localDate(new Date());
      downloadBlob(blob, `${kind}-report-${suffix}.${format}`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to export report"));
    } finally {
      setExporting(null);
    }
  }

  return (
    <main className="flex-1 space-y-5 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Server-generated reports with permission-checked exports.
        </p>
      </header>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Choose a report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <PermissionGate required={[PERM.REPORTS_FINANCIAL, PERM.ORDERS_VIEW, PERM.PAYMENTS_VIEW]}>
              <Button
                variant={kind === "financial" ? "default" : "outline"}
                className="rounded-none"
                onClick={() => {
                  setKind("financial");
                  setReport(null);
                }}
              >
                Financial activity
              </Button>
            </PermissionGate>
            <PermissionGate required={PERM.INVENTORY_VIEW}>
              <Button
                variant={kind === "inventory" ? "default" : "outline"}
                className="rounded-none"
                onClick={() => {
                  setKind("inventory");
                  setReport(null);
                }}
              >
                Inventory position
              </Button>
            </PermissionGate>
          </div>

          {kind === "financial" && (
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="report-from">From</Label>
                <DatePicker id="report-from" value={from} onChange={setFrom} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-to">To</Label>
                <DatePicker id="report-to" value={to} onChange={setTo} />
              </div>
              <Button
                className="rounded-none"
                onClick={generateReport}
                disabled={loading || !from || !to || from > to}
              >
                {loading ? <LoaderCircle className="animate-spin" /> : <FileText />}
                Generate report
              </Button>
            </div>
          )}
          {kind === "inventory" && (
            <Button className="rounded-none" onClick={generateReport} disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin" /> : <FileText />}
              Generate report
            </Button>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          <Alert>
            <AlertTitle>{report.title}</AlertTitle>
            <AlertDescription>{report.description}</AlertDescription>
          </Alert>
          <Card className="rounded-none">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{report.title}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Generated {new Date(report.generatedAt).toLocaleString()}</p>
              </div>
              <PermissionGate required={PERM.REPORTS_EXPORT}>
                <div className="flex flex-wrap gap-2">
                  {(["csv", "xlsx", "pdf"] as const).map((format) => (
                    <Button
                      key={format}
                      variant="outline"
                      className="rounded-none"
                      onClick={() => exportReport(format)}
                      disabled={exporting !== null}
                    >
                      {exporting === format ? <LoaderCircle className="animate-spin" /> : format === "xlsx" ? <FileSpreadsheet /> : <Download />}
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </PermissionGate>
            </CardHeader>
            <CardContent>
              <div className="max-h-[70vh] overflow-auto border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {report.columns.map((column) => (
                        <TableHead key={column} className="whitespace-nowrap">{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((row, index) => (
                      <TableRow key={`${index}-${String(row[0])}`}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={`${index}-${cellIndex}`} className="whitespace-nowrap">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {report.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={report.columns.length} className="py-8 text-center text-muted-foreground">
                          No report data is available for this selection.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
