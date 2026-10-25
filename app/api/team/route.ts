import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/middleware/withRateLimit";

export const revalidate = 300;

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (_request: NextRequest) => {
  const users = await prisma.user.findMany({
    where: { isActive: true, showOnHomepage: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      bio: true,
      profilePicture: true,
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName || ""}`.trim(),
      jobTitle: u.jobTitle,
      bio: u.bio,
      image: u.profilePicture,
    })),
  );
});
