import { Badge } from "@/components/ui/badge";
import { pretty } from "@/lib/format";

export const TONES = {
    green: "border-success/30 bg-success/10 text-success",
    amber: "border-warning/30 bg-warning/10 text-warning",
    blue: "border-info/30 bg-info/10 text-info",
    red: "border-destructive/30 bg-destructive/10 text-destructive",
    gray: "border-border bg-muted text-muted-foreground",
};

const toneOf = (s: string): keyof typeof TONES => {
    switch (s) {
        case "PAID": case "DELIVERED": case "REPLIED": case "ACTIVE": case "VERIFIED": return "green";
        case "PENDING": case "NEW": case "AUTHORIZED": case "PROCESSING": case "PARTIALLY_REFUNDED": case "UNVERIFIED": return "amber";
        case "SHIPPED": case "READ": return "blue";
        case "CANCELLED": case "FAILED": case "REFUNDED": case "DISABLED": return "red";
        default: return "gray";
    }
};

export function StatusBadge({ status }: { status: string }) {
    return <Badge variant="outline" className={`rounded-none ${TONES[toneOf(status)]}`}>{pretty(status)}</Badge>;
}