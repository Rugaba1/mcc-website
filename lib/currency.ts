export type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
  decimalDigits: number;
  enabled: boolean;
  isBase: boolean;
  rateToBase: number;
};

export function serializeCurrency(currency: {
  code: string;
  name: string;
  symbol: string;
  decimalDigits: number;
  enabled: boolean;
  isBase: boolean;
  rateToBase: unknown;
}): CurrencyOption {
  return {
    ...currency,
    rateToBase: Number(currency.rateToBase),
  };
}

export function getBaseCurrency(currencies: CurrencyOption[]) {
  const bases = currencies.filter((currency) => currency.isBase);
  if (bases.length !== 1) {
    throw new Error(
      `Currency configuration must contain exactly one base currency; found ${bases.length}.`,
    );
  }
  return bases[0];
}

export function convertCurrency(
  amount: number,
  sourceCode: string,
  targetCode: string,
  currencies: CurrencyOption[],
) {
  if (sourceCode === targetCode) return amount;
  const source = currencies.find((currency) => currency.code === sourceCode);
  const target = currencies.find((currency) => currency.code === targetCode);
  if (!source || !target) {
    throw new Error(
      `Cannot convert ${sourceCode} to ${targetCode}: currency or rate is not configured.`,
    );
  }
  return (amount * source.rateToBase) / target.rateToBase;
}
