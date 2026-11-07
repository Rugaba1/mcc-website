"use client";

import { Boxes } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../contexts/cart-context";

export default function CartButton() {
    const { itemCount, ready } = useCart();
    return (
        <Link href="/cart" aria-label={`My order, ${itemCount} items`} className="relative inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-current">
            <Boxes className="h-8 w-8" />
            {ready && itemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center px-1 text-[10px] font-bold">
                    {itemCount}
                </Badge>
            )}
        </Link>
    );
}