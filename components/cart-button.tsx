"use client";

import { ShoppingCart } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { useCart } from "../contexts/cart-context";

export default function CartButton() {
    const { itemCount, ready } = useCart();
    return (
        <Link href="/cart" aria-label={`Cart, ${itemCount} boxes`} className="relative inline-flex   p-2 text-foreground">
            <ShoppingCart className="h-8 w-8 font-serif" />
            {ready && itemCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full flex h-5 min-w-5 items-center justify-center  bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {itemCount}
                </span>
            )}
        </Link>
    );
}