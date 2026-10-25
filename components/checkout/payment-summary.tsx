"use client";

import { COMPANY } from "@/lib/company";
import { useFormatters } from "@/contexts/format-context";
import type { PaymentMethodId } from "@/lib/payments";

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium break-words">{value}</dd>
        </div>
    );
}

export function PaymentSummary({ method, phone, total }: {
    method: PaymentMethodId; phone: string; total: number;
}) {
    const { displayMoney, money, baseCurrency, displayCurrency } = useFormatters();
    const isMobileMoney = method === "MTN_MOMO" || method === "AIRTEL_MONEY";
    const provider = method === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money";
    const displayAmount = displayMoney(total, baseCurrency);
    const baseAmount = money(total, baseCurrency);

    return (
        <div aria-live="polite" className="space-y-3 border border-border bg-muted/40 p-4 text-sm">
            <h3 className="font-semibold">Payment details</h3>

            {isMobileMoney && (
                <dl className="space-y-2">
                    <Row label="Method" value={provider} />
                    <Row label="Amount due" value={baseAmount} />
                    {displayCurrency !== baseCurrency && (
                        <Row label={`Approx. in ${displayCurrency}`} value={displayAmount} />
                    )}
                    <Row label="Request sent to" value={phone || "Enter your phone number above"} />
                    <p className="pt-1 text-xs text-muted-foreground">
                        Approve the payment request on your phone. Questions? Call {COMPANY.phone}.
                    </p>
                </dl>
            )}

            {method === "BANK_TRANSFER" && (
                <dl className="space-y-2">
                    <Row label="Amount due" value={baseAmount} />
                    {displayCurrency !== baseCurrency && (
                        <Row label={`Approx. in ${displayCurrency}`} value={displayAmount} />
                    )}
                    <p className="whitespace-pre-line pt-1 text-xs text-muted-foreground">
                        {COMPANY.paymentInstructions}
                        {"\n"}Inquiries: {COMPANY.email} · {COMPANY.phone}
                    </p>
                </dl>
            )}

            {method === "CARD" && (
                <dl className="space-y-2">
                    <Row label="Amount due" value={baseAmount} />
                    {displayCurrency !== baseCurrency && (
                        <Row label={`Approx. in ${displayCurrency}`} value={displayAmount} />
                    )}
                    <p className="text-xs text-muted-foreground">
                        Our team will contact you{phone ? ` on ${phone}` : ""} to complete your card payment.
                        Inquiries: {COMPANY.email} · {COMPANY.phone}
                    </p>
                </dl>
            )}
        </div>
    );
}