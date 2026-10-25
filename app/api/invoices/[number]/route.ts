import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readInvoicePdf, verifyInvoiceSignature } from "@/lib/invoices/invoice";
import { withOptionalAuth } from "@/lib/middleware/withAuth";

export const runtime = "nodejs"; // needs fs
export const dynamic = "force-dynamic";

const notFound = () => new NextResponse("Not found", { status: 404 });

export const GET = withOptionalAuth(async (
  req: NextRequest,
  { user, params }: { user: { id: number } | null; params: Promise<{ number: string }> },
) => {
    
  const { number } = await params;
  const sp = req.nextUrl.searchParams;

  const invoice = await prisma.invoice.findUnique({
    where: { number },
    include: { order: { select: { userId: true } } },
  });
  if (!invoice) return notFound();

  
  let allowed = verifyInvoiceSignature(number, sp.get("exp"), sp.get("sig"));
  if (!allowed) {
    allowed =
      !!user &&
      invoice.order.userId === user.id;
  }
  if (!allowed) return notFound();

  const pdf = await readInvoicePdf(invoice.fileKey).catch(() => null);
  if (!pdf) return notFound();

  if (createHash("sha256").update(pdf).digest("hex") !== invoice.sha256) {
    console.error(`[invoice] integrity check failed for ${number}`);
    return new NextResponse("Invoice unavailable", { status: 500 });
  }

  const download = sp.get("download") === "1";
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${invoice.number}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}, { interval: 60_000, uniqueTokenPerInterval: 120 });
