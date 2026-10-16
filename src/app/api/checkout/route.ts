const order = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({
    where: { id: claims.userId },
    select: { isActive: true },
  });
  if (!user?.isActive) throw new CheckoutError("Account is not active");

  const variants = await tx.productVariant.findMany({
    where: { id: { in: ids }, active: true, product: { status: "ACTIVE" } },
    include: { product: { select: { name: true } } },
  });
  if (variants.length !== ids.length) {
    throw new CheckoutError("Some items in your cart are no longer available");
  }

  const lines = variants.map((v) => {
    const qty = qtyByVariant.get(v.id)!;
    const unit = Number(v.pricePerBox); // price comes from the DB, never the browser
    return { v, qty, unit, total: unit * qty };
  });

  // Atomic reservation: affects 0 rows if available stock is short.
  // Raw SQL because Prisma can't compare two columns in updateMany.
  for (const l of lines) {
    const n = await tx.$executeRaw`
      UPDATE inventory
      SET reservedBoxes = reservedBoxes + ${l.qty}
      WHERE variantId = ${l.v.id}
        AND (allowBackorder = 1 OR onHandBoxes - reservedBoxes >= ${l.qty})`;
    if (n === 0) {
      throw new CheckoutError(`Not enough stock for ${l.v.product.name} (${l.v.size})`);
    }
  }

  const totals = computeTotals(
    lines.map((l) => ({ price: l.unit, qty: l.qty })),
    ship.fee,
  );
  const delivery = ship.fulfillment === "DELIVERY";
  const orderNumber = `MCC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomInt(100000, 1000000)}`;

  const created = await tx.order.create({
    data: {
      orderNumber,
      userId: claims.userId,
      fulfillment: ship.fulfillment,
      subtotal: totals.subtotal,
      shippingFee: totals.shippingFee,
      taxTotal: totals.tax,
      grandTotal: totals.total,
      shipFullName: d.fullName,
      shipPhone: d.phone,
      shipDistrict: delivery ? d.district ?? null : null,
      shipSector: delivery ? d.sector || null : null,
      shipStreet: delivery ? d.street ?? null : null,
      customerNote: d.note || null,
      items: {
        create: lines.map((l) => ({
          variantId: l.v.id,
          productName: l.v.product.name,
          sku: l.v.sku,
          size: l.v.size,
          finish: l.v.finish,
          shadeCode: l.v.shadeCode,
          image: l.v.image,
          quantity: l.qty,
          sqmPerBox: l.v.sqmPerBox,
          unitPrice: l.unit,
          lineTotal: l.total,
        })),
      },
      history: { create: { status: "PENDING", note: "Order placed", changedById: claims.userId } },
    },
    select: { id: true, orderNumber: true },
  });

  await tx.stockMovement.createMany({
    data: lines.map((l) => ({
      variantId: l.v.id,
      type: "RESERVE" as const,
      quantity: l.qty,
      reference: created.orderNumber,
      createdById: claims.userId,
    })),
  });

  return created;
});