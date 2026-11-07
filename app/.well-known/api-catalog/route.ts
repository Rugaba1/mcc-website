import { siteConfig } from "@/config/site.config";

const publicApis = [
  ["/api/products", "List and search public products."],
  ["/api/products/{id}", "Get a product by numeric ID or stable slug."],
  ["/api/collections", "List public collections."],
  ["/api/catalogues", "List published catalogues."],
  ["/api/blog", "List published blog posts."],
  ["/api/publications", "List currently active publications."],
  ["/api/visualizer-products", "List products available to the visualizer."],
  ["/api/visualizer/scenes", "List visualizer scenes."],
] as const;

function catalogResponseHeaders(): Headers {
  const origin = siteConfig.siteUrl.replace(/\/$/, "");
  const headers = new Headers({
    "Content-Type": "application/linkset+json",
    "Cache-Control": "public, max-age=3600",
    Link: `<${origin}/.well-known/api-catalog>; rel="api-catalog"`,
  });
  return headers;
}

export function GET() {
  const origin = siteConfig.siteUrl.replace(/\/$/, "");
  const linkset = {
    linkset: publicApis.map(([path, description]) => ({
      anchor: `${origin}${path}`,
      description,
      "service-desc": [
        {
          href: `${origin}/openapi.json`,
          type: "application/vnd.oai.openapi+json;version=3.1",
        },
      ],
      "service-doc": [{ href: `${origin}/llms.txt`, type: "text/plain" }],
      status: [{ href: `${origin}/api/health` }],
    })),
  };

  return new Response(JSON.stringify(linkset), {
    headers: catalogResponseHeaders(),
  });
}

export function HEAD() {
  return new Response(null, { headers: catalogResponseHeaders() });
}
