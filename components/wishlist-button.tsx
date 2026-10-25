"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { api, apiErrorMessage } from "@/lib/api";
import { Button } from "./ui/button";

export function WishlistButton({ productId }: { productId: number }) {
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
    <Button variant="ghost" size="icon" onClick={() => void save()} aria-label="Save to wishlist">
      <Heart className="h-4 w-4" />
    </Button>
  );
}