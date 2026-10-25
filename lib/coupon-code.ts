const COUPON_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCouponCode() {
  const randomBytes = new Uint8Array(12);
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random generation is unavailable in this browser.");
  }

  globalThis.crypto.getRandomValues(randomBytes);
  const characters = Array.from(
    randomBytes,
    (value) => COUPON_ALPHABET[value & 31],
  );
  return `MCC-${characters.slice(0, 4).join("")}-${characters
    .slice(4, 8)
    .join("")}-${characters.slice(8).join("")}`;
}
