// src/lib/payments.ts
export const PAYMENT_METHODS = [
  "MTN_MOMO",
  "AIRTEL_MONEY",
  "CARD",
  "BANK_TRANSFER",
  "CASH_ON_DELIVERY",
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_OPTIONS: {
  id: PaymentMethodId;
  label: string;
  hint: string;
}[] = [
  {
    id: "MTN_MOMO",
    label: "MTN Mobile Money",
    hint: "Pay from your MTN MoMo wallet",
  },
  {
    id: "AIRTEL_MONEY",
    label: "Airtel Money",
    hint: "Pay from your Airtel Money wallet",
  },
  { id: "CARD", label: "Card", hint: "Visa / Mastercard" },
  {
    id: "BANK_TRANSFER",
    label: "Bank transfer",
    hint: "We'll send you the bank details",
  },
  {
    id: "CASH_ON_DELIVERY",
    label: "Cash",
    hint: "Pay when you receive or collect your order",
  },
];
