import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export async function GET() {
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
}
