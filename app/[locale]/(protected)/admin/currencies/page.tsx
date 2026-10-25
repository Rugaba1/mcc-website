"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import type { CurrencyOption } from "@/lib/currency";
import { CURRENCY_CONFIG_UPDATED_EVENT } from "@/contexts/format-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NewCurrency = {
  code: string;
  name: string;
  symbol: string;
  decimalDigits: string;
  rateToBase: string;
};

const emptyCurrency: NewCurrency = {
  code: "",
  name: "",
  symbol: "",
  decimalDigits: "2",
  rateToBase: "",
};

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [draft, setDraft] = useState<NewCurrency>(emptyCurrency);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadCurrencies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAdminCurrencies();
      setCurrencies(result.currencies);
      setRates(Object.fromEntries(
        result.currencies.map((currency) => [currency.code, String(currency.rateToBase)]),
      ));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not load currency settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrencies();
  }, [loadCurrencies]);

  async function createCurrency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.createCurrency({
        code: draft.code.trim().toUpperCase(),
        name: draft.name.trim(),
        symbol: draft.symbol.trim(),
        decimalDigits: Number(draft.decimalDigits),
        rateToBase: Number(draft.rateToBase),
      });
      window.dispatchEvent(new Event(CURRENCY_CONFIG_UPDATED_EVENT));
      setDraft(emptyCurrency);
      await loadCurrencies();
      toast.success("Currency added.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not add currency."));
    } finally {
      setBusy(false);
    }
  }

  async function saveRate(currency: CurrencyOption) {
    setBusy(true);
    try {
      await api.updateCurrency({
        code: currency.code,
        rateToBase: Number(rates[currency.code]),
      });
      window.dispatchEvent(new Event(CURRENCY_CONFIG_UPDATED_EVENT));
      await loadCurrencies();
      toast.success(`${currency.code} exchange rate updated.`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update exchange rate."));
    } finally {
      setBusy(false);
    }
  }

  async function setEnabled(currency: CurrencyOption, enabled: boolean) {
    setBusy(true);
    try {
      await api.updateCurrency({ code: currency.code, enabled });
      window.dispatchEvent(new Event(CURRENCY_CONFIG_UPDATED_EVENT));
      await loadCurrencies();
      toast.success(`${currency.code} ${enabled ? "enabled" : "disabled"}.`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update currency."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <header>
        <h2 className="text-2xl font-semibold">Currencies</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage storefront display currencies and exchange rates. Rates are
          units of the base currency per one unit of the listed currency. Order,
          payment, and invoice amounts remain in the base currency.
        </p>
      </header>

      <form onSubmit={createCurrency} className="grid gap-4 border p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="space-y-1 text-sm">
          <span>ISO code</span>
          <Input required maxLength={3} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Name</span>
          <Input required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Symbol</span>
          <Input required maxLength={8} value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Decimal digits</span>
          <Input required type="number" min={0} max={4} value={draft.decimalDigits} onChange={(e) => setDraft({ ...draft, decimalDigits: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Rate to base</span>
          <Input required type="number" min="0.0000000001" step="any" value={draft.rateToBase} onChange={(e) => setDraft({ ...draft, rateToBase: e.target.value })} />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>Add currency</Button>
        </div>
      </form>

      <div className="overflow-x-auto border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Currency</th>
              <th className="p-3">Display</th>
              <th className="p-3">Rate to base</th>
              <th className="p-3">State</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => (
              <tr key={currency.code} className="border-t">
                <td className="p-3">
                  <strong>{currency.code}</strong>
                  <span className="ml-2 text-muted-foreground">{currency.name}</span>
                  {currency.isBase && <span className="ml-2 text-xs text-primary">Base</span>}
                </td>
                <td className="p-3">{currency.symbol} · {currency.decimalDigits} decimals</td>
                <td className="p-3">
                  <Input
                    aria-label={`${currency.code} rate to base`}
                    type="number"
                    min="0.0000000001"
                    step="any"
                    disabled={currency.isBase || busy}
                    value={rates[currency.code] ?? ""}
                    onChange={(event) => setRates({ ...rates, [currency.code]: event.target.value })}
                    className="max-w-48"
                  />
                </td>
                <td className="p-3">{currency.enabled ? "Enabled" : "Disabled"}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {!currency.isBase && (
                      <>
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void saveRate(currency)}>
                          Save rate
                        </Button>
                        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void setEnabled(currency, !currency.enabled)}>
                          {currency.enabled ? "Disable" : "Enable"}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && currencies.length === 0 && (
              <tr><td className="p-4 text-muted-foreground" colSpan={5}>No currencies configured.</td></tr>
            )}
            {loading && <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading currencies…</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
