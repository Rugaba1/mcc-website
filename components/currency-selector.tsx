"use client";

import { useFormatters } from "@/contexts/format-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySelector({ className = "" }: { className?: string }) {
  const { availableCurrencies, displayCurrency, setDisplayCurrency } =
    useFormatters();
  if (availableCurrencies.length < 2) return null;

  return (
    <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
      <SelectTrigger
        aria-label="Display currency"
        className={`w-[4.5rem] shrink-0 px-2 sm:w-28 sm:px-3 lg:w-[10rem] ${className}`}
      >
        <SelectValue>{displayCurrency}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {availableCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.code} · {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
