export const LEGAL_DOCUMENTS = [
  {
    type: "TERMS_AND_CONDITIONS",
    slug: "terms-and-conditions",
    label: "Terms and Conditions",
  },
  {
    type: "TERMS_OF_SERVICE",
    slug: "terms-of-service",
    label: "Terms of Service",
  },
  {
    type: "PRIVACY_POLICY",
    slug: "privacy-policy",
    label: "Privacy Policy",
  },
] as const;

export type LegalDocumentType = (typeof LEGAL_DOCUMENTS)[number]["type"];
export type LegalDocumentSlug = (typeof LEGAL_DOCUMENTS)[number]["slug"];

const documentBySlug = new Map(
  LEGAL_DOCUMENTS.map((document) => [document.slug, document]),
);

export function legalDocumentFromSlug(
  slug: string,
): (typeof LEGAL_DOCUMENTS)[number] | undefined {
  return documentBySlug.get(slug as LegalDocumentSlug);
}
