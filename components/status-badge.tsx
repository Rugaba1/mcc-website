import { Badge } from "@/components/ui/badge";
import { pretty } from "@/lib/format";

export const TONES = {
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    red: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
    gray: "border-border bg-muted text-muted-foreground",
};

const toneOf = (s: string): keyof typeof TONES => {
    switch (s) {
        case "PAID": case "DELIVERED": case "REPLIED": case "ACTIVE": return "green";
        case "PENDING": case "NEW": case "AUTHORIZED": case "PROCESSING": case "PARTIALLY_REFUNDED": return "amber";
        case "SHIPPED": case "READ": return "blue";
        case "CANCELLED": case "FAILED": case "REFUNDED": return "red";
        default: return "gray";
    }
};

export function StatusBadge({ status }: { status: string }) {
    return <Badge variant="outline" className={`rounded-none ${TONES[toneOf(status)]}`}>{pretty(status)}</Badge>;
}