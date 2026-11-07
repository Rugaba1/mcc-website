import { siteConfig } from "@/config/site.config";

const jsonResponse = {
  "200": {
    description: "Successful response.",
    content: {
      "application/json": {
        schema: { type: "object", additionalProperties: true },
      },
    },
  },
  "default": {
    description: "The request could not be completed.",
    content: {
      "application/json": {
        schema: { type: "object", additionalProperties: true },
      },
    },
  },
};

const listParameters = [
  {
    name: "page",
    in: "query",
    description: "1-based result page where supported.",
    schema: { type: "integer", minimum: 1 },
  },
  {
    name: "limit",
    in: "query",
    description: "Maximum number of results where supported.",
    schema: { type: "integer", minimum: 1, maximum: 60 },
  },
];

export function GET() {
  const document = {
    openapi: "3.1.0",
    info: {
      title: `${siteConfig.siteName} Public API`,
      version: "1.0.0",
      description:
        "Read-only public endpoints for discovering current products, collections, catalogues, posts, publications, and visualizer resources. Product prices and availability must be taken from current API responses.",
    },
    servers: [{ url: siteConfig.siteUrl }],
    paths: {
      "/api/products": {
        get: {
          operationId: "listProducts",
          summary: "List public products",
          description:
            "Search and filter public products. Supports search, query, category, featured, badge, sort, page, and limit parameters. Each product includes active variants with size, finish, pricePerSqm, and currency. pricePerSqm is the price per square metre. Use /api/products/{id} for current variant availability.",
          parameters: [
            ...listParameters,
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "category",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: jsonResponse,
        },
      },
      "/api/products/{id}": {
        get: {
          operationId: "getProduct",
          summary: "Get a product by ID or slug",
          description:
            "Retrieve current public product details and active variants. Each variant includes size, finish, pricePerSqm (price per square metre), currency, and current availability.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Numeric product ID or stable product slug.",
              schema: { type: "string" },
            },
          ],
          responses: {
            ...jsonResponse,
            "404": { description: "Product not found." },
          },
        },
      },
      "/api/collections": {
        get: {
          operationId: "listCollections",
          summary: "List public collections",
          parameters: listParameters,
          responses: jsonResponse,
        },
      },
      "/api/catalogues": {
        get: {
          operationId: "listCatalogues",
          summary: "List published catalogues",
          responses: jsonResponse,
        },
      },
      "/api/blog": {
        get: {
          operationId: "listPublishedBlogPosts",
          summary: "List published blog posts",
          parameters: [
            ...listParameters,
            { name: "locale", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: jsonResponse,
        },
      },
      "/api/publications": {
        get: {
          operationId: "listActivePublications",
          summary: "List currently active publications",
          responses: jsonResponse,
        },
      },
      "/api/visualizer-products": {
        get: {
          operationId: "listVisualizerProducts",
          summary: "List products available to the tile visualizer",
          responses: jsonResponse,
        },
      },
      "/api/visualizer/scenes": {
        get: {
          operationId: "listVisualizerScenes",
          summary: "List available visualizer scenes",
          responses: jsonResponse,
        },
      },
      "/api/health": {
        get: {
          operationId: "getServiceHealth",
          summary: "Check HTTP service availability",
          responses: {
            "200": {
              description: "The web service is responding.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["status"],
                    properties: { status: { const: "ok" } },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return Response.json(document, {
    headers: {
      "Content-Type": "application/vnd.oai.openapi+json;version=3.1",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
