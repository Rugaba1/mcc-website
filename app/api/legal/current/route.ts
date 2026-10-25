import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import {
  getLocalizedLegalContent,
  getPublishedLegalDocuments,
  LEGAL_DOCUMENTS,
} from "@/lib/legal/documents";

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 120,
})(async (_request: NextRequest, { locale }: { locale: string }) => {
  const current = await getPublishedLegalDocuments();
  const documents = LEGAL_DOCUMENTS.flatMap(({ type, slug, label }) => {
    const version = current.get(type);
    if (!version) return [];
    const localized = getLocalizedLegalContent(version, locale);
    return [{
      id: version.id,
      documentType: type,
      slug,
      version: version.version,
      title: localized.title || label,
    }];
  });
  return NextResponse.json({ documents });
});
