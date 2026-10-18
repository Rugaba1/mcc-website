"use client";

import { ShoppingCart, ShoppingCartPlus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/cart-context";
import type { Product } from "@/lib/api";
import { Button } from "./ui/button";
import { cn } from "cn";

export default function AddToCartButton({
    product, variantId, className, sm = false,
}: { product: Product; variantId?: number; sm?: boolean , className?:string}) {
    const { addToCart } = useCart();
    const variants = (product.variants ?? []).filter((v) => v.active);
    const v = variants.find((x) => x.id === variantId) ?? variants[0];

    if (!v) {
        return <Button size={sm ? "icon" : "default"} variant="outline" disabled title="Currently unavailable">
            <ShoppingCartPlus className="h-4 w-4 mx-1" />{!sm && <span className="ml-2">Unavailable</span>}
        </Button>;
    }

    return (
        <Button
            size={sm ? "icon" : "default"}
            title="Add to cart"
            className={cn("mx-1", className)}
            aria-label={`Add ${product.name} to cart`}
            onClick={() => {
                addToCart({
                    variantId: v.id,
                    productId: product.id,
                    name: product.name,
                    image: v.image || product.image,
                    size: v.size,
                    finish: v.finish,
                    color: v.color,
                    pricePerBox: Number(v.pricePerBox),
                    sqmPerBox: Number(v.sqmPerBox),
                });
                toast.success(`${product.name} added to cart`);
            }}
            
        >
            <ShoppingCartPlus className="h-4 w-4" />
            {!sm && <span className="ml-2">Add to cart</span>}
        </Button>
    );
}