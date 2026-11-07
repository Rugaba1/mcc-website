"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { api, apiErrorMessage } from "@/lib/api";
import { Button } from "./ui/button";

export function WishlistButton({
  productId,
  showLabel = false,
}: {
  productId: number;
  showLabel?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  async function save() {
    if (!isAuthenticated) return router.push("/login?next=/account/wishlist");
    try {
      await api.addToWishlist(productId); // idempotent
      toast.success("Saved to your wishlist");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not save"));
    }
  }

  return (
    <Button
      variant="outline"
      size={showLabel ? "default" : "icon"}
      onClick={() => void save()}
      aria-label="Save to wishlist"
      className={showLabel ? "min-h-11 gap-2 whitespace-nowrap" : "min-h-11 min-w-11"}
    >
      <Heart className="h-4 w-4" aria-hidden="true" />
      {showLabel && <span>Wishlist</span>}
    </Button>
  );
}