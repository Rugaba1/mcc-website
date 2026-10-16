"use client";

import {
    createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";

export interface CartItem {
    variantId: number;
    productId: number;
    name: string;
    image: string;
    size: string;
    finish: string | null;
    color: string | null;
    pricePerBox: number; // display only: the server re-prices every order
    sqmPerBox: number;
    qty: number; // boxes
}

const KEY = "mcc-cart-v1";
const MAX_QTY = 9999;

interface CartContextType {
    items: CartItem[];
    ready: boolean; // false until localStorage has been read
    itemCount: number;
    addToCart: (item: Omit<CartItem, "qty">, qty?: number) => void;
    setQty: (variantId: number, qty: number) => void;
    removeFromCart: (variantId: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const clamp = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n) || 1));

function read(): CartItem[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (i) => Number.isInteger(i?.variantId) && Number.isFinite(i?.qty) && Number.isFinite(i?.pricePerBox),
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
        localStorage.removeItem("cart"); // old format
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

    const addToCart = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
        setItems((prev) =>
            prev.some((p) => p.variantId === item.variantId)
                ? prev.map((p) => (p.variantId === item.variantId ? { ...p, ...item, qty: clamp(p.qty + qty) } : p))
                : [...prev, { ...item, qty: clamp(qty) }],
        );
    }, []);

    const setQty = useCallback((variantId: number, qty: number) => {
        setItems((prev) => prev.map((p) => (p.variantId === variantId ? { ...p, qty: clamp(qty) } : p)));
    }, []);

    const removeFromCart = useCallback((variantId: number) => {
        setItems((prev) => prev.filter((p) => p.variantId !== variantId));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const value = useMemo<CartContextType>(
        () => ({
            items, ready,
            itemCount: items.reduce((s, i) => s + i.qty, 0),
            addToCart, setQty, removeFromCart, clearCart,
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