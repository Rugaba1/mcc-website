import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireStaff } from "../../../lib/auth/require-staff";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error } = await requireStaff(request);
  if (error) return error;

  const rows = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    omit: { ipHash: true },
  });

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      ackSentAt: r.ackSentAt?.toISOString() ?? null,
      repliedAt: r.repliedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
}
