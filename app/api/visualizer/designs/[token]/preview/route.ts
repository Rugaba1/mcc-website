import { NextRequest, NextResponse } from "next/server";

import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ token: string }> };

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 120,
})(async (_request: NextRequest, context: RouteContext) => {
  const { token } = await context.params;
  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.json({ error: "Design preview not found" }, { status: 404 });
  }

  try {
    const design = await prisma.visualizerDesign.findUnique({
      where: { shareToken: token },
      select: { previewImage: true },
    });
    const match = design?.previewImage?.match(
      /^data:image\/(webp|jpeg);base64,([A-Za-z0-9+/]+=*)$/,
    );
    if (!match) {
      return NextResponse.json({ error: "Design preview not found" }, { status: 404 });
    }

    const image = Buffer.from(match[2], "base64");
    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": `image/${match[1]}`,
        "Content-Length": String(image.length),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET visualizer design preview failed:", error);
    return NextResponse.json(
      { error: "Could not load design preview" },
      { status: 500 },
    );
  }
});
