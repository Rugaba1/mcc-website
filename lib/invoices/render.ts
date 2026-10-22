import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Content,
  TDocumentDefinitions,
  TFontDictionary,
} from "pdfmake/interfaces";
import { FONT_FILES } from "./config";
import { buildInvoiceDefinition, type InvoiceData } from "./template";

interface PdfDoc {
  on(event: "data", cb: (chunk: Buffer) => void): void;
  on(event: "end", cb: () => void): void;
  on(event: "error", cb: (err: Error) => void): void;
  end(): void;
}

const PdfPrinter = require("pdfmake") as new (fonts: TFontDictionary) => {
  createPdfKitDocument(definition: TDocumentDefinitions): PdfDoc;
};

const printer = new PdfPrinter(FONT_FILES);

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};
const LOGO_EXTS = [".png", ".jpg", ".jpeg", ".svg"];

async function findLogoFile(): Promise<string | null> {
  const pub = path.join(process.cwd(), "public");
  if (process.env.INVOICE_LOGO_PATH)
    return path.resolve(process.env.INVOICE_LOGO_PATH);

  for (const ext of LOGO_EXTS) {
    const f = path.join(pub, `logo${ext}`);
    if (
      await fs
        .stat(f)
        .then((s) => s.isFile())
        .catch(() => false)
    )
      return f;
  }
  const dir = path.join(pub, "logo");
  const files = await fs.readdir(dir).catch(() => [] as string[]);
  const hit = files.find((f) =>
    LOGO_EXTS.includes(path.extname(f).toLowerCase()),
  );
  return hit ? path.join(dir, hit) : null;
}

let logoCache: Content | null | undefined;
async function loadLogo(): Promise<Content | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    const file = await findLogoFile();
    if (!file) return (logoCache = null);
    const ext = path.extname(file).toLowerCase();
    const raw = await fs.readFile(file);
    logoCache =
      ext === ".svg"
        ? { svg: raw.toString("utf8"), fit: [150, 50] }
        : {
            image: `data:${MIME[ext]};base64,${raw.toString("base64")}`,
            fit: [150, 50],
          };
  } catch (e) {
    console.error("[invoice] logo load failed, falling back to text", e);
    logoCache = null;
  }
  return logoCache;
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const definition = buildInvoiceDefinition(data, await loadLogo());
  const doc = printer.createPdfKitDocument(definition);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}
