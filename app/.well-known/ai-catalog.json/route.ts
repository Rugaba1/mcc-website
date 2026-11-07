import { siteConfig } from "@/config/site.config";

export function GET() {
  const origin = siteConfig.siteUrl.replace(/\/$/, "");
  const hostname = new URL(origin).hostname;
  const manifest = {
    specVersion: "1.0",
    host: {
      displayName: siteConfig.siteName,
      identifier: `did:web:${hostname}`,
    },
    entries: [
      {
        identifier: `urn:air:${hostname}:api:public-store`,
        displayName: "Public Store API Catalog",
        type: "application/linkset+json",
        url: `${origin}/.well-known/api-catalog`,
        representativeQueries: [
          "Search Mountain Ceramics tile products",
          "Find current tile collections and catalogues",
        ],
      },
      {
        identifier: `urn:air:${hostname}:api:openapi`,
        displayName: "Public Store OpenAPI Description",
        type: "application/vnd.oai.openapi+json",
        url: `${origin}/openapi.json`,
        representativeQueries: [
          "How can I query the public product API?",
          "What public catalogue endpoints are available?",
        ],
      },
      {
        identifier: `urn:air:${hostname}:documentation:llms`,
        displayName: "AI and Crawler Guide",
        type: "text/plain",
        url: `${origin}/llms.txt`,
        representativeQueries: [
          "How should an agent use the Mountain Ceramics website?",
          "Where are the store's public pages and APIs?",
        ],
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
