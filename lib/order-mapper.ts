type Named = {
  firstName: string;
  lastName: string | null;
  email: string;
} | null;

export function customerName(o: { shipFullName: string | null; user: Named }) {
  return (
    o.shipFullName ??
    (o.user ? `${o.user.firstName} ${o.user.lastName ?? ""}`.trim() : "Guest")
  );
}

export function customerEmail(o: { guestEmail: string | null; user: Named }) {
  return o.user?.email ?? o.guestEmail;
}

export const userNameSelect = {
  firstName: true,
  lastName: true,
  email: true,
} as const;
