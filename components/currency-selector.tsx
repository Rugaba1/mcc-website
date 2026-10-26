"use client";

import { useFormatters } from "@/contexts/format-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencyFlag } from "@/lib/currency";

export function CurrencySelector({ className = "" }: { className?: string }) {
  const { availableCurrencies, displayCurrency, setDisplayCurrency } =
    useFormatters();
  if (availableCurrencies.length < 2) return null;

  return (
    <Select value={displayCurrency} onValueChange={setDisplayCurrency} >
      <SelectTrigger
        aria-label="Display currency"
        className={`w-18 shrink-0 px-2   sm:px-3   ${className}`}
      >
        <SelectValue>
          {currencyFlag(displayCurrency)} {displayCurrency}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="border-none">
        {availableCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currencyFlag(currency.code)} {currency.code} · {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
