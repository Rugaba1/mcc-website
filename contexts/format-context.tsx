"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fmtDate, fmtDateTime, formatDatePattern, formatNumber, money } from "@/lib/format";
import { TIME_ZONE_COOKIE_NAME } from "@/lib/timezone";
import { api } from "@/lib/api";
import { convertCurrency, type CurrencyOption } from "@/lib/currency";
import { siteConfig } from "@/config/site.config";

export const CURRENCY_COOKIE_NAME = "mcc_currency";
export const CURRENCY_CONFIG_UPDATED_EVENT = "mcc-currency-config-updated";

type FormatContextValue = {
  timeZone: string;
  baseCurrency: string;
  displayCurrency: string;
  currencies: CurrencyOption[];
  availableCurrencies: CurrencyOption[];
  setDisplayCurrency: (currency: string) => void;
};

const FormatContext = createContext<FormatContextValue | null>(null);

export function FormatProvider({
  children,
  initialTimeZone,
  secureCookie,
}: {
  children: React.ReactNode;
  initialTimeZone: string;
  secureCookie: boolean;
}) {
  const router = useRouter();
  const requestedTimeZone = useRef<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState(siteConfig.defaultCurrency);
  const [displayCurrency, setSelectedCurrency] = useState(siteConfig.defaultCurrency);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyOption[]>([]);

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimeZone || browserTimeZone === initialTimeZone) {
      requestedTimeZone.current = null;
      return;
    }
    if (requestedTimeZone.current === browserTimeZone) return;

    requestedTimeZone.current = browserTimeZone;
    const cookie = `${TIME_ZONE_COOKIE_NAME}=${encodeURIComponent(browserTimeZone)}; Path=/; Max-Age=31536000; SameSite=Lax${secureCookie ? "; Secure" : ""}`;
    document.cookie = cookie;
    router.refresh();
  }, [initialTimeZone, router, secureCookie]);

  useEffect(() => {
    let cancelled = false;
    const loadCurrencies = () => {
      void api.getCurrencies().then((config) => {
        if (cancelled) return;
        const savedCurrency = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith(`${CURRENCY_COOKIE_NAME}=`))
          ?.slice(CURRENCY_COOKIE_NAME.length + 1);
        const requestedCurrency = savedCurrency ?? "";
        const selectedCurrency = config.availableCurrencies.some(
          (currency) => currency.code === requestedCurrency,
        )
          ? requestedCurrency
          : config.baseCurrency.code;

        setBaseCurrency(config.baseCurrency.code);
        setCurrencies(config.currencies);
        setAvailableCurrencies(config.availableCurrencies);
        setSelectedCurrency(selectedCurrency);
        document.cookie = `${CURRENCY_COOKIE_NAME}=${encodeURIComponent(selectedCurrency)}; Path=/; Max-Age=31536000; SameSite=Lax${secureCookie ? "; Secure" : ""}`;
      }).catch((error: unknown) => {
        if (!cancelled) {
          console.error("Could not load currency configuration", error);
        }
      });
    };
    loadCurrencies();
    window.addEventListener(CURRENCY_CONFIG_UPDATED_EVENT, loadCurrencies);
    return () => {
      cancelled = true;
      window.removeEventListener(CURRENCY_CONFIG_UPDATED_EVENT, loadCurrencies);
    };
  }, [secureCookie]);

  const setDisplayCurrency = useCallback((currency: string) => {
    if (!availableCurrencies.some((option) => option.code === currency)) {
      throw new Error(`Currency ${currency} is not enabled for display.`);
    }
    setSelectedCurrency(currency);
    document.cookie = `${CURRENCY_COOKIE_NAME}=${encodeURIComponent(currency)}; Path=/; Max-Age=31536000; SameSite=Lax${secureCookie ? "; Secure" : ""}`;
  }, [availableCurrencies, secureCookie]);

  const value = useMemo(() => ({
    timeZone: initialTimeZone,
    baseCurrency,
    displayCurrency,
    currencies,
    availableCurrencies,
    setDisplayCurrency,
  }), [
    initialTimeZone,
    baseCurrency,
    displayCurrency,
    currencies,
    availableCurrencies,
    setDisplayCurrency,
  ]);
  return <FormatContext.Provider value={value}>{children}</FormatContext.Provider>;
}

export function useFormatters() {
  const context = useContext(FormatContext);
  if (!context) throw new Error("useFormatters must be used inside FormatProvider");

  const locale = useLocale();
  return useMemo(
    () => ({
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, locale, options),
      money: (value: number, currency = context.baseCurrency) => money(value, currency, locale),
      displayMoney: (value: number, sourceCurrency = context.baseCurrency) => {
        const converted = convertCurrency(
          value,
          sourceCurrency,
          context.displayCurrency,
          context.currencies,
        );
        const target = context.currencies.find(
          (currency) => currency.code === context.displayCurrency,
        );
        return money(converted, context.displayCurrency, locale, target?.decimalDigits);
      },
      date: (value?: string | Date | null) => fmtDate(value, locale, context.timeZone),
      datePattern: (value: string | Date, pattern: string) =>
        formatDatePattern(value, pattern, locale, context.timeZone),
      dateTime: (value?: string | Date | null) =>
        fmtDateTime(value, locale, context.timeZone),
      timeZone: context.timeZone,
      baseCurrency: context.baseCurrency,
      displayCurrency: context.displayCurrency,
      currencies: context.currencies,
      availableCurrencies: context.availableCurrencies,
      setDisplayCurrency: context.setDisplayCurrency,
    }),
    [context, locale],
  );
}
