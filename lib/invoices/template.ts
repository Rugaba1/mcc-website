import type {
  Content,
  TDocumentDefinitions,
  TableCell,
} from "pdfmake/interfaces";
import { BRAND, COMPANY } from "./config";
import { fmtDate, money as formatMoney } from "@/lib/format";

export type InvoiceKindName = "PROFORMA" | "INVOICE" | "CREDIT_NOTE";

export interface InvoiceItemData {
  name: string;
  sku: string;
  size: string;
  finish?: string | null;
  shade?: string | null;
  saleType: "SQM" | "CONTAINER";
  sqm: number;
  containers: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceData {
  kind: InvoiceKindName;
  number: string;
  orderNumber: string;
  relatedInvoiceNumber?: string;
  issuedAt: Date;
  placedAt: Date;
  currency: string;
  currencyDigits?: number;
  billTo: { name: string; email?: string | null; phone?: string | null; tin?: string | null };
  fulfillment: "DELIVERY" | "PICKUP";
  shipTo: { name?: string | null; phone: string; lines: string[] };
  items: InvoiceItemData[];
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  shipping: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethods: string[];
  customerNote?: string | null;
}

const TITLES: Record<InvoiceKindName, string> = {
  PROFORMA: "PROFORMA INVOICE",
  INVOICE: "COMMERCIAL INVOICE",
  CREDIT_NOTE: "CREDIT NOTE",
};

const money = (n: number, cur: string, digits?: number) =>
  formatMoney(n, cur, "en", digits);

function badgeFor(d: InvoiceData) {
  if (d.kind === "CREDIT_NOTE")
    return { text: "REFUNDED", color: BRAND.danger };
  if (d.kind === "PROFORMA")
    return { text: "AWAITING PAYMENT", color: BRAND.ink, border: BRAND.gold };
  return d.balance <= 0
    ? { text: "PAID", color: BRAND.success }
    : { text: "PAYMENT DUE", color: BRAND.danger };
}

const label = (t: string): Content => ({
  text: t.toUpperCase(),
  fontSize: 7.5,
  bold: true,
  color: BRAND.green,
  characterSpacing: 0.8,
  margin: [0, 0, 0, 4],
});

export function buildInvoiceDefinition(
  d: InvoiceData,
  logo: Content | null,
): TDocumentDefinitions {
  const cur = d.currency;
  const badge = badgeFor(d);
  const borderColor = badge.border ?? badge.color;

  const companyLines = [
    COMPANY.address,
    COMPANY.tin && `TIN: ${COMPANY.tin}`,
    COMPANY.registrationNumber &&
      `Registration no.: ${COMPANY.registrationNumber}`,
    [
      COMPANY.phone,
      COMPANY.alternatePhone,
      COMPANY.email,
      COMPANY.salesEmail,
    ]
      .filter(Boolean)
      .join("  ·  "),
    COMPANY.website,
  ].filter(Boolean) as string[];

  /* ── header ─────────────────────────────────────────── */
  const header: Content = {
    columns: [
      {
        width: "*",
        stack: [
          logo ?? {
            text: COMPANY.name,
            font: "Glovar",
            bold: true,
            fontSize: 16,
            color: BRAND.green,
          },
          {
            text: companyLines.join("\n"),
            fontSize: 8,
            color: BRAND.muted,
            lineHeight: 1.35,
            margin: [0, 8, 0, 0],
          },
        ],
      },
      {
        width: 230,
        alignment: "right",
        stack: [
          {
            text: TITLES[d.kind],
            font: "Glovar",
            bold: true,
            fontSize: 22,
            color: BRAND.green,
          },
          { text: d.number, fontSize: 10, bold: true, margin: [0, 4, 0, 10] },
          {
            table: {
              body: [
                [
                  {
                    text: badge.text,
                    bold: true,
                    fontSize: 8.5,
                    color: badge.color,
                    alignment: "center",
                  },
                ],
              ],
            },
            layout: {
              hLineColor: () => borderColor,
              vLineColor: () => borderColor,
              hLineWidth: () => 1.2,
              vLineWidth: () => 1.2,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 12,
              paddingRight: () => 12,
            },
            alignment: "right",
            margin: [90, 0, 0, 0],
          },
        ],
      },
    ],
  };

  const goldRule: Content = {
    canvas: [{ type: "rect", x: 0, y: 0, w: 515, h: 3, color: BRAND.gold }],
    margin: [0, 14, 0, 16],
  };

  /* ── parties + meta ─────────────────────────────────── */
  const shipBlock: Content =
    d.fulfillment === "PICKUP"
      ? { text: "Customer pickup", fontSize: 9, lineHeight: 1.35 }
      : {
          text: [d.shipTo.name, ...d.shipTo.lines, d.shipTo.phone]
            .filter(Boolean)
            .join("\n"),
          fontSize: 9,
          lineHeight: 1.35,
        };

  const metaRow = (k: string, v: string): TableCell[] => [
    { text: k, color: BRAND.muted, fontSize: 8.5 },
    { text: v, bold: true, fontSize: 8.5, alignment: "right" },
  ];
  const metaBody: TableCell[][] = [
    metaRow("Order no.", d.orderNumber),
    metaRow("Order date", fmtDate(d.placedAt)),
    metaRow("Issued", fmtDate(d.issuedAt)),
  ];
  if (d.relatedInvoiceNumber)
    metaBody.push(metaRow("Original invoice", d.relatedInvoiceNumber));
  if (d.paymentMethods.length)
    metaBody.push(metaRow("Payment", d.paymentMethods.join(", ")));

  const parties: Content = {
    columns: [
      {
        width: "*",
        stack: [
          label("Billed to"),
          {
            text: [
              d.billTo.name,
              d.billTo.email,
              d.billTo.phone,
              d.billTo.tin && `Buyer TIN: ${d.billTo.tin}`,
            ]
              .filter(Boolean)
              .join("\n"),
            fontSize: 9,
            lineHeight: 1.35,
          },
        ],
      },
      {
        width: "*",
        stack: [
          label(d.fulfillment === "PICKUP" ? "Fulfilment" : "Deliver to"),
          shipBlock,
        ],
      },
      {
        width: 170,
        table: { widths: ["*", "auto"], body: metaBody },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingTop: () => 2,
          paddingBottom: () => 2,
          paddingLeft: () => 0,
          paddingRight: () => 0,
        },
      },
    ],
    columnGap: 18,
  };

  /* ── items ──────────────────────────────────────────── */
  const th = (
    t: string,
    align: "left" | "right" | "center" = "left",
  ): TableCell => ({
    text: t.toUpperCase(),
    bold: true,
    fontSize: 7.5,
    color: BRAND.white,
    alignment: align,
    characterSpacing: 0.5,
  });

  const rows: TableCell[][] = d.items.map((it, i) => {
    const spec = [it.size, it.finish, it.shade && `Shade ${it.shade}`]
      .filter(Boolean)
      .join("  ·  ");
    return [
      { text: String(i + 1), color: BRAND.muted },
      {
        stack: [
          { text: it.name, bold: true },
          ...(spec ? [{ text: spec, fontSize: 7.5, color: BRAND.muted }] : []),
        ],
      },
      {
        stack: [
          { text: `${it.sqm.toFixed(2)} m²`, alignment: "center" },
          ...(it.saleType === "CONTAINER"
            ? [
                {
                  text: `${it.containers} container${it.containers === 1 ? "" : "s"}`,
                  alignment: "center" as const,
                  fontSize: 7.5,
                  color: BRAND.muted,
                },
              ]
            : []),
        ],
      },
      { text: money(it.unitPrice, cur, d.currencyDigits), alignment: "right" },
      { text: money(it.lineTotal, cur, d.currencyDigits), alignment: "right", bold: true },
    ];
  });

  const itemsTable: Content = {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: [18, "*", 70, 78, 82],
      body: [
        [
          th("#"),
          th("Item"),
          th("Quantity", "center"),
          th("Price / m²", "right"),
          th("Total", "right"),
        ],
        ...rows,
      ],
    },
    layout: {
      fillColor: (row: number) => (row === 0 ? BRAND.green : null),
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.body.length ? 0 : 0.6,
      vLineWidth: () => 0,
      hLineColor: () => BRAND.border,
      paddingTop: () => 7,
      paddingBottom: () => 7,
      paddingLeft: () => 6,
      paddingRight: () => 6,
    },
    margin: [0, 22, 0, 14],
  };

  /* ── totals ─────────────────────────────────────────── */
  const tRow = (
    k: string,
    v: string,
    opts: { bold?: boolean; color?: string } = {},
  ): TableCell[] => [
    { text: k, color: opts.color ?? BRAND.muted, bold: opts.bold },
    { text: v, alignment: "right", color: opts.color, bold: opts.bold },
  ];
  const totals: TableCell[][] = [tRow("Subtotal", money(d.subtotal, cur, d.currencyDigits))];
  if (d.discount > 0)
    totals.push(
      tRow(
        d.couponCode ? `Discount (${d.couponCode})` : "Discount",
        `- ${money(d.discount, cur, d.currencyDigits)}`,
        { color: BRAND.success },
      ),
    );
  if (d.fulfillment === "DELIVERY")
    totals.push(
      tRow("Delivery", d.shipping > 0 ? money(d.shipping, cur, d.currencyDigits) : "Free"),
    );
  if (d.tax > 0) totals.push(tRow("VAT (18%)", money(d.tax, cur, d.currencyDigits)));

  const grandIndex = totals.length;
  totals.push([
    {
      text: d.kind === "CREDIT_NOTE" ? "TOTAL REFUNDED" : "TOTAL",
      bold: true,
      color: BRAND.ink,
      fontSize: 10,
    },
    {
      text: money(d.total, cur, d.currencyDigits),
      bold: true,
      color: BRAND.ink,
      fontSize: 10,
      alignment: "right",
    },
  ]);
  if (d.kind !== "CREDIT_NOTE") {
    totals.push(tRow("Amount paid", money(d.amountPaid, cur, d.currencyDigits)));
    totals.push(
      tRow("Balance due", money(d.balance, cur, d.currencyDigits), {
        bold: true,
        color: d.balance > 0 ? BRAND.danger : BRAND.success,
      }),
    );
  }

  const notes: Content[] = [];
  if (d.kind === "PROFORMA") {
    notes.push(label("How to pay"));
    notes.push({
      text:
        COMPANY.paymentInstructions ||
        "Complete payment at checkout, or contact us to arrange payment. Stock is reserved while your order is pending.",
      fontSize: 8.5,
      lineHeight: 1.4,
    });
    notes.push({
      text: "This is not a tax invoice. A final invoice is issued once payment is received.",
      fontSize: 8,
      color: BRAND.muted,
      margin: [0, 6, 0, 0],
    });
  }
  if (d.kind !== "PROFORMA") {
    notes.push({
      text: "This system-generated document is not fiscalized through Rwanda Revenue Authority's EBM system and is not an EBM tax invoice or credit note.",
      fontSize: 8,
      color: BRAND.muted,
      margin: [0, 6, 0, 0],
    });
  }
  if (d.customerNote) {
    notes.push({
      text: "CUSTOMER NOTE",
      fontSize: 7.5,
      bold: true,
      color: BRAND.green,
      characterSpacing: 0.8,
      margin: [0, notes.length ? 12 : 0, 0, 4],
    });
    notes.push({ text: d.customerNote, fontSize: 8.5, lineHeight: 1.4 });
  }

  const totalsBlock: Content = {
    columns: [
      { width: "*", stack: notes, margin: [0, 0, 24, 0] },
      {
        width: 235,
        table: { widths: ["*", "auto"], body: totals },
        layout: {
          fillColor: (row: number) => (row === grandIndex ? BRAND.gold : null),
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingTop: () => 5,
          paddingBottom: () => 5,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        unbreakable: true,
      },
    ],
  };

  /* ── closing ────────────────────────────────────────── */
  const thanks: Content = {
    text: `Thank you for choosing ${COMPANY.name}.`,
    font: "Glovar",
    bold: true,
    fontSize: 11,
    color: BRAND.green,
    margin: [0, 34, 0, 0],
  };

  return {
    info: {
      title: `${TITLES[d.kind]} ${d.number}`,
      author: COMPANY.name,
      subject: `Order ${d.orderNumber}`,
    },
    pageSize: "A4",
    pageMargins: [40, 40, 40, 60],
    defaultStyle: { font: "CenturyGothic", fontSize: 9, color: BRAND.text },
    content: [header, goldRule, parties, itemsTable, totalsBlock, thanks],
    footer: (page: number, pages: number) => ({
      margin: [40, 18, 40, 0],
      columns: [
        {
          text: `${COMPANY.name}${COMPANY.tin ? `  ·  TIN ${COMPANY.tin}` : ""}`,
          fontSize: 7.5,
          color: BRAND.muted,
        },
        {
          text: `${d.number}  ·  Page ${page} of ${pages}`,
          fontSize: 7.5,
          color: BRAND.muted,
          alignment: "right",
        },
      ],
    }),
  };
}
