import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";

export async function releaseCheckoutReservation(
  tx: Prisma.TransactionClient,
  reservation: {
    id: number;
    tokenHash: string;
    items: { variantId: number; quantitySqm: Prisma.Decimal }[];
  },
) {
  const claimed = await tx.checkoutReservation.updateMany({
    where: { id: reservation.id, status: "ACTIVE" },
    data: { status: "RELEASED" },
  });
  if (claimed.count !== 1) return false;

  for (const item of reservation.items) {
    const released = await tx.inventory.updateMany({
      where: {
        variantId: item.variantId,
        reservedSqm: { gte: item.quantitySqm },
      },
      data: { reservedSqm: { decrement: item.quantitySqm } },
    });
    if (released.count !== 1) {
      throw new Error(`Inventory reservation mismatch for variant ${item.variantId}`);
    }
    await tx.stockMovement.create({
      data: {
        variantId: item.variantId,
        type: "RELEASE",
        quantity: item.quantitySqm,
        reference: `checkout:${reservation.tokenHash}`,
        note: "Checkout hold expired or was replaced",
      },
    });
  }
  return true;
}

export async function releaseExpiredCheckoutReservations(
  tx: Prisma.TransactionClient,
  now = new Date(),
) {
  let releasedCount = 0;
  while (true) {
    const expired = await tx.checkoutReservation.findMany({
      where: { status: "ACTIVE", expiresAt: { lte: now } },
      take: 100,
      include: { items: true },
    });
    if (!expired.length) return releasedCount;
    for (const reservation of expired) {
      if (await releaseCheckoutReservation(tx, reservation)) releasedCount += 1;
    }
  }
}
