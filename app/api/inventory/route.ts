import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const runtime = "nodejs";

export const GET = withPermission(PERM.INVENTORY_VIEW)(
  async (request: NextRequest) => {
  try {
    const pagination = parsePagination(request.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    const state = request.nextUrl.searchParams.get("state") ?? "all";
    const sort = request.nextUrl.searchParams.get("sort") ?? "product";
    if (!["all", "ok", "low", "out"].includes(state) ||
        !["product", "stock-asc", "stock-desc"].includes(sort)) {
      return NextResponse.json({ error: "Invalid inventory filter" }, { status: 400 });
    }
    const variants = await prisma.productVariant.findMany({
      orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
      include: {
        product: { select: { id: true, name: true } },
        inventory: true,
      },
    });

    // Stock is in m². Prisma returns Decimals, so convert to numbers for JSON.
    const items = variants.map((v) => ({
        id: v.id,
        productId: v.product.id,
        productName: v.product.name,
        sku: v.sku,
        size: v.size,
        finish: v.finish,
        color: v.color,
        stockSqm: Number(v.inventory?.onHandSqm ?? 0),
        reservedSqm: Number(v.inventory?.reservedSqm ?? 0), // held by unpaid orders
        lowStockThreshold: Number(v.inventory?.reorderLevel ?? 0),
      }));
    const summary = {
      variants: items.length,
      boxes: items.reduce((sum, item) => sum + item.stockSqm, 0),
      low: items.filter((item) => item.stockSqm > item.reservedSqm && item.stockSqm - item.reservedSqm <= item.lowStockThreshold).length,
      out: items.filter((item) => item.stockSqm - item.reservedSqm <= 0).length,
    };
    if (!pagination.requested) return NextResponse.json(items);

    const search = pagination.search.toLowerCase();
    const filtered = items.filter((item) => {
      const available = item.stockSqm - item.reservedSqm;
      const matchesSearch = !search || [item.productName, item.sku, item.size, item.finish, item.color]
        .some((value) => value?.toLowerCase().includes(search));
      return matchesSearch && (
        state === "all" ||
        (state === "out" && available <= 0) ||
        (state === "low" && available > 0 && available <= item.lowStockThreshold) ||
        (state === "ok" && available > item.lowStockThreshold)
      );
    });
    if (sort === "stock-asc") filtered.sort((a, b) => (a.stockSqm - a.reservedSqm) - (b.stockSqm - b.reservedSqm));
    else if (sort === "stock-desc") filtered.sort((a, b) => (b.stockSqm - b.reservedSqm) - (a.stockSqm - a.reservedSqm));
    const total = filtered.length;
    const { page } = pageForTotal(total, pagination.page, pagination.pageSize);
    return NextResponse.json({
      ...paginatedResult(
        filtered.slice((page - 1) * pagination.pageSize, page * pagination.pageSize),
        total,
        page,
        pagination.pageSize,
      ),
      summary,
    });
  } catch (e) {
    console.error("Inventory list error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
