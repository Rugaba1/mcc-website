"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { ProductWithVariantsAndRelated } from "@/lib/api";
import { useCart } from "@/contexts/cart-context";
import { PurchaseOptions } from "./purchase-option";
import { useFormatters } from "@/contexts/format-context";

export function ProductPurchase({
    product,
    initialVariantId,
    onAdded,
    className = "space-y-5 border p-5",
}: {
    product: Pick<ProductWithVariantsAndRelated, "id" | "name" | "image" | "variants">;
    initialVariantId?: number;
    onAdded?: () => void;
    className?: string;
}) {
    const { addToCart } = useCart();
    const { displayMoney } = useFormatters();
    const variants = (product.variants ?? []).filter((v) => v.active && v.pricePerSqm > 0);
    const [selectedId, setSelectedId] = useState(initialVariantId ?? variants[0]?.id);
    const v = variants.find((x) => x.id === selectedId) ?? variants[0];

    if (!v) {
        return <p className="border p-4 text-sm text-muted-foreground">This tile isn’t available to order online yet. Please request a quote.</p>;
    }

    return (
        <div className={className}>
            {variants.length > 1 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Choose a size and finish</p>
                    <div className="flex flex-wrap gap-2">
                        {variants.map((x) => (
                            <button
                                key={x.id}
                                type="button"
                                onClick={() => setSelectedId(x.id)}
                                className={`flex items-center gap-2 border px-3 py-2 text-left text-sm transition-colors ${x.id === v.id ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                            >
                                {x.color && <span className="size-4 shrink-0 border" style={{ background: x.color }} />}
                                <span>
                                    <span className="block font-semibold">{x.size}{x.finish ? ` · ${x.finish}` : ""}</span>
                                    <span className="block text-xs text-muted-foreground">{displayMoney(x.pricePerSqm, x.currency)} / m²</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <PurchaseOptions
                key={v.id}
                variant={{ pricePerSqm: v.pricePerSqm, containerPricePerSqm: v.containerPricePerSqm ?? null, sqmPerContainer: v.sqmPerContainer ?? null }}
                currency={v.currency}
                onAdd={({ saleType, qty }) => {
                    addToCart(
                        {
                            variantId: v.id,
                            productId: product.id,
                            name: product.name,
                            image: v.image ?? product.image,
                            size: v.size,
                            finish: v.finish,
                            color: v.color,
                            currency: v.currency,
                            saleType,
                            pricePerSqm: v.pricePerSqm,
                            containerPricePerSqm: v.containerPricePerSqm ?? null,
                            sqmPerContainer: v.sqmPerContainer ?? null,
                        },
                        qty,
                    );
                    toast.success(`${product.name} added to your cart`);
                    onAdded?.();
                }}
            />
        </div>
    );
}