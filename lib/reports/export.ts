import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import type { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";
import type { ReportFormat, ReportTable } from "./report-data";
import { FONT_FILES } from "@/lib/invoices/config";
import { siteConfig } from "@/config/site.config";

interface PdfDoc {
  on(event: "data", cb: (chunk: Buffer) => void): void;
  on(event: "end", cb: () => void): void;
  on(event: "error", cb: (err: Error) => void): void;
  end(): void;
}

const PdfPrinter = require("pdfmake") as new (fonts: TFontDictionary) => {
  createPdfKitDocument(definition: TDocumentDefinitions): PdfDoc;
};
const pdfPrinter = new PdfPrinter(FONT_FILES);

function safeCsvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function renderReport(
  report: ReportTable,
  format: ReportFormat,
): Promise<Buffer> {
  if (format === "csv") {
    const contents = [
      [report.title],
      [report.description],
      ["Generated at", report.generatedAt],
      [],
      report.columns,
      ...report.rows,
    ]
      .map((row) => row.map(safeCsvCell).join(","))
      .join("\r\n");
    return Buffer.from(`\uFEFF${contents}`, "utf8");
  }

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Mountain Ceramics";
    workbook.created = new Date(report.generatedAt);
    const sheet = workbook.addWorksheet(report.title.slice(0, 31));
    sheet.addRow([report.title]);
    sheet.addRow([report.description]);
    sheet.addRow(["Generated at", report.generatedAt]);
    sheet.addRow([]);
    sheet.addRow(report.columns);
    for (const row of report.rows) sheet.addRow(row);
    sheet.getRow(5).font = { bold: true };
    sheet.getRow(5).alignment = { vertical: "middle", wrapText: true };
    sheet.views = [{ state: "frozen", ySplit: 5 }];
    sheet.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: report.rows.length + 5, column: report.columns.length },
    };
    sheet.columns.forEach((column, index) => {
      column.width = Math.min(
        36,
        Math.max(14, ...sheet.getColumn(index + 1).values.map((value) => String(value ?? "").length + 2)),
      );
    });
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  const tableRows = [
    report.columns.map((text) => ({ text, color: "#ffffff", bold: true })),
    ...report.rows.map((row) => row.map(String)),
  ];
  const definition: TDocumentDefinitions = {
    info: { title: report.title, subject: report.description },
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [32, 86, 32, 56],
    defaultStyle: { font: "CenturyGothic", fontSize: 7 },
    header: () => ({
      margin: [32, 18, 32, 0],
      stack: [
        { text: siteConfig.companyName, font: "Glovar", fontSize: 13, bold: true, color: "#004f46" },
        {
          text: [
            siteConfig.companyAddress,
            siteConfig.companyTin && `TIN: ${siteConfig.companyTin}`,
            siteConfig.companyRegistrationNumber && `Registration no.: ${siteConfig.companyRegistrationNumber}`,
          ].filter(Boolean).join("  |  "),
          fontSize: 7,
          color: "#5f6b63",
          margin: [0, 3, 0, 0],
        },
        { canvas: [{ type: "line", x1: 0, y1: 7, x2: 778, y2: 7, lineWidth: 1.5, lineColor: "#d6b43e" }] },
      ],
    }),
    footer: (currentPage: number, pageCount: number) => ({
      margin: [32, 0, 32, 18],
      columns: [
        { text: `${siteConfig.companyName} · ${siteConfig.companyWebsite}`, fontSize: 7, color: "#5f6b63" },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: "right", fontSize: 7, color: "#5f6b63" },
      ],
    }),
    content: [
      { text: report.title, font: "Glovar", fontSize: 16, bold: true, color: "#004f46", margin: [0, 0, 0, 6] },
      { text: report.description, fontSize: 8, margin: [0, 0, 0, 4] },
      { text: `Generated at ${report.generatedAt}`, fontSize: 7, margin: [0, 0, 0, 12] },
      {
        table: {
          headerRows: 1,
          widths: Array.from({ length: report.columns.length }, () => "*"),
          body: tableRows,
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? "#00574f" : null),
          hLineColor: () => "#d6d3d1",
          vLineColor: () => "#d6d3d1",
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 4,
          paddingRight: () => 4,
        },
      },
    ],
  };
  const doc = pdfPrinter.createPdfKitDocument(definition);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export function reportDownload(
  buffer: Buffer,
  format: ReportFormat,
  name: string,
): NextResponse {
  const mimeTypes: Record<ReportFormat, string> = {
    csv: "text/csv; charset=utf-8",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pdf: "application/pdf",
  };
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeTypes[format],
      "Content-Disposition": `attachment; filename="${name}.${format}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export function requestedFormat(value: string | null): ReportFormat | null {
  return value === "csv" || value === "xlsx" || value === "pdf" ? value : null;
}
