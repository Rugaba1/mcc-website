import flags from "react-phone-number-input/flags";
import { Globe2 } from "lucide-react";
import { currencyCountryCode } from "@/lib/currency";

export function CurrencyFlag({ code }: { code: string }) {
  const country = currencyCountryCode(code);

  if (country === "EU") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-6 shrink-0"
        viewBox="0 0 24 16"
      >
        <rect width="24" height="16" fill="#003399" />
        <g fill="#ffcc00">
          <circle cx="12" cy="3.1" r="0.8" />
          <circle cx="15.4" cy="4" r="0.8" />
          <circle cx="17.4" cy="6.4" r="0.8" />
          <circle cx="17.4" cy="9.6" r="0.8" />
          <circle cx="15.4" cy="12" r="0.8" />
          <circle cx="12" cy="12.9" r="0.8" />
          <circle cx="8.6" cy="12" r="0.8" />
          <circle cx="6.6" cy="9.6" r="0.8" />
          <circle cx="6.6" cy="6.4" r="0.8" />
          <circle cx="8.6" cy="4" r="0.8" />
        </g>
      </svg>
    );
  }

  const Flag = country ? flags[country] : undefined;
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden [&_svg]:h-full [&_svg]:w-full"
    >
      {Flag ? <Flag title={code} /> : <Globe2 className="size-4" />}
    </span>
  );
}
