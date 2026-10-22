"use client";

import { useState } from "react";
import { ShoppingCartPlus } from "lucide-react";
import type { Product } from "@/lib/api";
import { ProductPurchase } from "@/components/product-purchase";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "cn";

 
export default function AddToCartButton({
    product, variantId, className, sm = false,
}: { product: Product; variantId?: number; sm?: boolean; className?: string }) {
    const [open, setOpen] = useState(false);
    const available = (product.variants ?? []).some((v) => v.active && Number(v.pricePerSqm) > 0);

    if (!available) {
        return <Button size={sm ? "icon" : "default"} variant="outline" disabled title="Currently unavailable">
            <ShoppingCartPlus className="h-4 w-4 mx-1" />{!sm && <span className="ml-2">Unavailable</span>}
        </Button>;
    }

    return (
        <>
            <Button
                size={sm ? "icon" : "default"}
                title="Add to cart"
                className={cn("mx-1", className)}
                aria-label={`Add ${product.name} to cart`}
                onClick={() => setOpen(true)}
            >
                <ShoppingCartPlus className="h-4 w-4" />
                {!sm && <span className="ml-2">Add to cart</span>}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{product.name}</DialogTitle>
                        <DialogDescription>Choose how you want to buy.</DialogDescription>
                    </DialogHeader>
                    <ProductPurchase product={product} initialVariantId={variantId} onAdded={() => setOpen(false)} className="space-y-5" />
                </DialogContent>
            </Dialog>
        </>
    );
}