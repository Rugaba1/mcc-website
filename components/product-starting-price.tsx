import type { ProductVariant } from "@/lib/api";

const labels: Record<string, { from: string; quote: string }> = {
  en: { from: "From", quote: "Request a quote" },
  fr: { from: "À partir de", quote: "Demander un devis" },
  rw: { from: "Guhera kuri", quote: "Saba igiciro" },
};

export function ProductStartingPrice({
  variants,
  locale,
}: {
  variants?: ProductVariant[];
  locale: string;
}) {
  const startingPrices = new Map<string, number>();
  for (const variant of variants ?? []) {
    if (
      !variant.active ||
      !Number.isFinite(variant.pricePerSqm) ||
      variant.pricePerSqm <= 0
    ) {
      continue;
    }

    const currentPrice = startingPrices.get(variant.currency);
    if (currentPrice === undefined || variant.pricePerSqm < currentPrice) {
      startingPrices.set(variant.currency, variant.pricePerSqm);
    }
  }

  const copy = labels[locale.split("-")[0]] ?? labels.en;
  if (startingPrices.size === 0) {
    return (
      <p className="text-sm font-semibold text-primary">
        {copy.quote}
      </p>
    );
  }

  return (
    <p className="text-sm font-semibold text-primary">
      {copy.from}{" "}
      {[...startingPrices].map(([currency, price]) => (
        <span key={currency} className="mr-2">
          {new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            currencyDisplay: "code",
          }).format(price)}{" "}
          / m²
        </span>
      ))}
    </p>
  );
}
