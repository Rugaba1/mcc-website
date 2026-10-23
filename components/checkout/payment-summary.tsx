import { COMPANY } from "@/lib/company";
import { money } from "@/lib/format";
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
    const isMobileMoney = method === "MTN_MOMO" || method === "AIRTEL_MONEY";
    const provider = method === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money";

    return (
        <div aria-live="polite" className="space-y-3 border border-border bg-muted/40 p-4 text-sm">
            <h3 className="font-semibold">Payment details</h3>

            {isMobileMoney && (
                <dl className="space-y-2">
                    <Row label="Method" value={provider} />
                    <Row label="Amount due" value={money(total)} />
                    <Row label="Request sent to" value={phone || "Enter your phone number above"} />
                    <p className="pt-1 text-xs text-muted-foreground">
                        Approve the payment request on your phone. Questions? Call {COMPANY.phone}.
                    </p>
                </dl>
            )}

            {method === "BANK_TRANSFER" && (
                <dl className="space-y-2">
                    <Row label="Amount due" value={money(total)} />
                    <Row label="Account name" value={COMPANY.name} />
                    <Row label="Bank" value={COMPANY.bank.name} />
                    <Row label="Account number" value={COMPANY.bank.accountNumber} />
                    <Row label="Address" value={COMPANY.address} />
                    <p className="pt-1 text-xs text-muted-foreground">
                        Use your order number as the payment reference once the order is placed.
                        Inquiries: {COMPANY.email} · {COMPANY.phone}
                    </p>
                </dl>
            )}

            {method === "CARD" && (
                <dl className="space-y-2">
                    <Row label="Amount due" value={money(total)} />
                    <p className="text-xs text-muted-foreground">
                        Our team will contact you{phone ? ` on ${phone}` : ""} to complete your card payment.
                        Inquiries: {COMPANY.email} · {COMPANY.phone}
                    </p>
                </dl>
            )}
        </div>
    );
}