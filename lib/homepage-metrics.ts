import { prisma } from "@/lib/prisma";

export type HomepageMetrics = {
  projectCount: number | null;
  productCount: number | null;
  collectionCount: number | null;
};

export async function getHomepageMetrics(): Promise<HomepageMetrics> {
  try {
    const [projectCount, productCount, collectionCount] = await Promise.all([
      prisma.project.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.collection.count(),
    ]);

    return { projectCount, productCount, collectionCount };
  } catch (error) {
    console.error("Failed to load homepage metrics:", error);
    return { projectCount: null, productCount: null, collectionCount: null };
  }
}
