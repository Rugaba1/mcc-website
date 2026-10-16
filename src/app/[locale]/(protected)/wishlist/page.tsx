"use client";

import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/app/i18n/routing";
import { api, apiErrorMessage, type WishlistEntry } from "@/lib/api";
import { money } from "@/lib/format";
import { useResource } from "@/hooks/use-resource";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";

const fetchWishlist = () => api.getWishlist();

export default function WishlistPage() {
  const { data, loading, reload } = useResource<WishlistEntry[]>(fetchWishlist, []);
  const { addToCart } = useCart();

  async function remove(productId: number) {
    try { await api.removeFromWishlist(productId); reload(); }
    catch (e) { toast.error(apiErrorMessage(e, "Could not remove")); }
  }

  function add(w: WishlistEntry) {
    if (!w.variant) return;
    addToCart({
      variantId: w.variant.id, productId: w.productId, name: w.name, image: w.image,
      size: w.variant.size, finish: w.variant.finish, color: w.variant.color,
      pricePerBox: w.variant.pricePerBox, sqmPerBox: w.variant.sqmPerBox,
    });
    toast.success(`${w.name} added to cart`);
  }

  return (
    <div className="space-y-5">
      <h1 className="font-playfair text-3xl font-bold">Wishlist</h1>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <Heart className="mx-auto mb-2 h-8 w-8" />
          Tiles you save will appear here.
          <div className="mt-3"><Button asChild><Link href="/#products">Browse tiles</Link></Button></div>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((w) => (
          <div key={w.productId} className="overflow-hidden rounded-2xl border border-border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={w.image} alt={w.name} className="h-44 w-full object-cover" />
            <div className="space-y-2 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{w.categoryLabel}</p>
              <p className="font-semibold">{w.name}</p>
              <p className="text-sm text-muted-foreground">{w.variant ? `From ${money(w.variant.pricePerBox)} / box` : "Currently unavailable"}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1" disabled={!w.variant} onClick={() => add(w)}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
                </Button>
                <Button size="sm" variant="outline" onClick={() => void remove(w.productId)}>Remove</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}