import { prisma } from "@/lib/prisma";

export class AccountDeleteError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

export async function deleteUserAccount(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { permissions: { include: { permission: true } } },
  });
  if (!user) throw new AccountDeleteError("User not found", 404);

  // never delete the last active admin
  const isAdmin = user.permissions.some((p) =>
    ["admin", "users.manage"].includes(p.permission.code),
  );
  if (isAdmin) {
    const others = await prisma.user.count({
      where: {
        id: { not: userId },
        isActive: true,
        permissions: {
          some: { permission: { code: { in: ["admin", "users.manage"] } } },
        },
      },
    });
    if (others === 0)
      throw new AccountDeleteError(
        "This is the last administrator and can't be deleted",
      );
  }

  // orders still in progress: refuse
  const active = await prisma.order.count({
    where: {
      userId,
      OR: [
        { status: { in: ["PAID", "PROCESSING", "SHIPPED"] } },
        {
          status: "PENDING",
          paymentStatus: { in: ["AUTHORIZED", "PAID", "PARTIALLY_REFUNDED"] },
        },
      ],
    },
  });
  if (active > 0)
    throw new AccountDeleteError(
      `${active} order${active === 1 ? " is" : "s are"} still in progress. Finish or cancel ${active === 1 ? "it" : "them"} first.`,
    );

  await prisma.$transaction(
    async (tx) => {
      // 1. unpaid orders: release reserved stock, then delete them completely
      const unpaid = await tx.order.findMany({
        where: {
          userId,
          status: "PENDING",
          paymentStatus: { in: ["PENDING", "FAILED"] },
        },
        select: {
          id: true,
          orderNumber: true,
          items: { select: { variantId: true, quantity: true } },
        },
      });

      for (const o of unpaid) {
        const [reserved, released] = await Promise.all([
          tx.stockMovement.findFirst({
            where: { type: "RESERVE", reference: o.orderNumber },
          }),
          tx.stockMovement.findFirst({
            where: { type: "RELEASE", reference: o.orderNumber },
          }),
        ]);
        if (reserved && !released) {
          for (const it of o.items) {
            if (!it.variantId) continue;
            await tx.inventory.updateMany({
              where: {
                variantId: it.variantId,
                reservedSqm: { gte: it.quantity },
              },
              data: { reservedSqm: { decrement: it.quantity } },
            });
            await tx.stockMovement.create({
              data: {
                variantId: it.variantId,
                type: "RELEASE",
                quantity: it.quantity,
                reference: o.orderNumber,
                note: "Account deleted",
              },
            });
          }
        }
      }

      const unpaidIds = unpaid.map((o) => o.id);
      if (unpaidIds.length) {
        await tx.invoice.deleteMany({ where: { orderId: { in: unpaidIds } } });
        await tx.payment.deleteMany({ where: { orderId: { in: unpaidIds } } });
        await tx.orderStatusHistory.deleteMany({
          where: { orderId: { in: unpaidIds } },
        });
        await tx.orderItem.deleteMany({
          where: { orderId: { in: unpaidIds } },
        });
        await tx.order.deleteMany({ where: { id: { in: unpaidIds } } });
      }

      // 2. finished orders stay: keep the buyer's contact, then detach from the user
      await tx.order.updateMany({
        where: { userId, guestEmail: null },
        data: { guestEmail: user.email },
      });
      if (user.phoneNumber)
        await tx.order.updateMany({
          where: { userId, guestPhone: null },
          data: { guestPhone: user.phoneNumber },
        });
      await tx.order.updateMany({ where: { userId }, data: { userId: null } });

      // 3. "who did it" pointers on records we keep
      await tx.payment.updateMany({
        where: { recordedById: userId },
        data: { recordedById: null },
      });
      await tx.stockMovement.updateMany({
        where: { createdById: userId },
        data: { createdById: null },
      });
      await tx.orderStatusHistory.updateMany({
        where: { changedById: userId },
        data: { changedById: null },
      });
      await tx.userPermission.updateMany({
        where: { grantedById: userId },
        data: { grantedById: null },
      });

      // 4. everything that belongs to the user
      await tx.visualizerDesignItem.deleteMany({
        where: { design: { userId } },
      });
      await tx.visualizerDesign.deleteMany({ where: { userId } });
      await tx.cartItem.deleteMany({ where: { cart: { userId } } });
      await tx.cart.deleteMany({ where: { userId } });
      await tx.wishlistItem.deleteMany({ where: { userId } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.address.deleteMany({ where: { userId } });
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.forgetPasswordRequest.deleteMany({ where: { userId } });
      await tx.userPermission.deleteMany({ where: { userId } });
      await tx.permissionLog.deleteMany({ where: { targetUserId: userId } });
      await tx.user.update({
        where: { id: userId },
        data: { role: { set: [] } },
      });

      // 5. the user
      await tx.user.delete({ where: { id: userId } });
    },
    { timeout: 20000 },
  );
}
