"use client";

import { useFormatters } from "@/contexts/format-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyFlag } from "@/components/currency-flag";

export function CurrencySelector({ className = "" }: { className?: string }) {
  const { availableCurrencies, displayCurrency, setDisplayCurrency } =
    useFormatters();
  if (availableCurrencies.length === 0) return null;

  return (
    <Select value={displayCurrency} onValueChange={setDisplayCurrency} >
      <SelectTrigger
        aria-label="Display currency"
        className={`shrink-0 gap-1 px-1 sm:px-3 ${className || "w-26"}`}
      >
        <SelectValue>
          <span className="inline-flex items-center gap-1.5">
            <CurrencyFlag code={displayCurrency} />
            <span>
              {displayCurrency}
           </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="border-none">
        {availableCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <CurrencyFlag code={currency.code} />
            <span className="ml-2">{currency.code} · {currency.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
