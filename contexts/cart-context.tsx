"use client";

import {
    createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { MIN_SQM, priceLine, type PricedLine, type SaleType } from "@/lib/sale-pricing";

export interface CartItem {
    variantId: number;
    productId: number;
    name: string;
    image: string;
    size: string;
    finish: string | null;
    color: string | null;
    currency?: string;
    saleType: SaleType;
    qty: number; // m² when saleType is SQM, number of containers when CONTAINER
    // display only: the server re-prices every order
    pricePerSqm: number;
    containerPricePerSqm: number | null;
    sqmPerContainer: number | null;
}

const KEY = "mcc-cart-v2"; // v1 counted boxes, so old carts are dropped
const MAX_SQM = 100_000;
const MAX_CONTAINERS = 999;

const same = (a: { variantId: number; saleType: SaleType }, b: { variantId: number; saleType: SaleType }) =>
    a.variantId === b.variantId && a.saleType === b.saleType;

export const clampQty = (saleType: SaleType, n: number) =>
    saleType === "CONTAINER"
        ? Math.min(MAX_CONTAINERS, Math.max(1, Math.floor(n) || 1))
        : Math.min(MAX_SQM, Math.max(MIN_SQM, Math.round((Number(n) || MIN_SQM) * 100) / 100));

/** What this cart line costs (null if it can't be priced). Display only. */
export function lineOf(item: CartItem): PricedLine | null {
    try {
        return priceLine(item, item.saleType, item.qty);
    } catch {
        return null;
    }
}

interface CartContextType {
    items: CartItem[];
    ready: boolean; // false until localStorage has been read
    itemCount: number; // number of lines (m² and containers can't be added together)
    subtotal: number; // display only
    addToCart: (item: Omit<CartItem, "qty">, qty: number) => void;
    setQty: (variantId: number, saleType: SaleType, qty: number) => void;
    removeFromCart: (variantId: number, saleType: SaleType) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function read(): CartItem[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (i) =>
                Number.isInteger(i?.variantId) &&
                (i?.saleType === "SQM" || i?.saleType === "CONTAINER") &&
                Number.isFinite(i?.qty) &&
                Number.isFinite(i?.pricePerSqm),
        );
    } catch {
        return [];
    }
}

export default function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [ready, setReady] = useState(false);

    // Load once, and follow changes made in other tabs
    useEffect(() => {
        localStorage.removeItem("cart"); // oldest format
        localStorage.removeItem("mcc-cart-v1"); // counted boxes
        setItems(read());
        setReady(true);
        const onStorage = (e: StorageEvent) => {
            if (e.key === KEY) setItems(read());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Save, but never before the first load or it would wipe the stored cart
    useEffect(() => {
        if (!ready) return;
        try {
            localStorage.setItem(KEY, JSON.stringify(items));
        } catch {
            /* storage full or blocked */
        }
    }, [items, ready]);

    const addToCart = useCallback((item: Omit<CartItem, "qty">, qty: number) => {
        setItems((prev) =>
            prev.some((p) => same(p, item))
                ? prev.map((p) => (same(p, item) ? { ...p, ...item, qty: clampQty(item.saleType, p.qty + qty) } : p))
                : [...prev, { ...item, qty: clampQty(item.saleType, qty) }],
        );
    }, []);

    const setQty = useCallback((variantId: number, saleType: SaleType, qty: number) => {
        setItems((prev) => prev.map((p) => (same(p, { variantId, saleType }) ? { ...p, qty: clampQty(saleType, qty) } : p)));
    }, []);

    const removeFromCart = useCallback((variantId: number, saleType: SaleType) => {
        setItems((prev) => prev.filter((p) => !same(p, { variantId, saleType })));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const value = useMemo<CartContextType>(
        () => ({
            items,
            ready,
            itemCount: items.length,
            subtotal: items.reduce((s, i) => s + (lineOf(i)?.total ?? 0), 0),
            addToCart,
            setQty,
            removeFromCart,
            clearCart,
        }),
        [items, ready, addToCart, setQty, removeFromCart, clearCart],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}