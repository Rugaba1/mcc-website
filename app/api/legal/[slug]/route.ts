import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import {
  getLocalizedLegalContent,
  getPublishedLegalDocuments,
  legalDocumentFromSlug,
} from "@/lib/legal/documents";

type Context = { params: Promise<{ slug: string }>; locale: string };

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 120,
})(async (_request: NextRequest, context: Context) => {
  const { slug } = await context.params;
  const document = legalDocumentFromSlug(slug);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const version = (await getPublishedLegalDocuments()).get(document.type);
  if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: version.id,
    documentType: version.documentType,
    slug,
    version: version.version,
    publishedAt: version.publishedAt,
    ...getLocalizedLegalContent(version, context.locale),
  });
});
