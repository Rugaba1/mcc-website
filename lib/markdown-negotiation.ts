const publicPagePrefixes = [
  "/about",
  "/blog",
  "/catalogue",
  "/collections",
  "/contact",
  "/legal",
  "/products",
  "/projects",
  "/publications",
  "/why-us",
];

export function acceptsMarkdown(accept: string | null): boolean {
  if (!accept) return false;

  return accept.split(",").some((mediaRange) => {
    const [mediaType, ...parameters] = mediaRange.trim().split(";");
    if (mediaType.toLowerCase() !== "text/markdown") return false;

    const qualityParameter = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => /^q=/i.test(parameter));
    if (!qualityParameter) return true;

    const quality = Number(qualityParameter.slice(2));
    return Number.isFinite(quality) && quality > 0 && quality <= 1;
  });
}

export function isPublicMarkdownPage(
  pathname: string,
  locales: readonly string[],
): boolean {
  const segments = pathname.split("/");
  if (locales.includes(segments[1] ?? "")) segments.splice(1, 1);

  const path = `/${segments.slice(1).join("/")}`.replace(/\/+$/, "") || "/";
  return (
    path === "/" ||
    (path !== "/legal/accept" &&
      !path.startsWith("/legal/accept/") &&
      publicPagePrefixes.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      ))
  );
}
