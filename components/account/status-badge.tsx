import { Badge } from "../ui/badge";

export function StatusBadge({ status }: { status: string }) {
    const bad = ["CANCELLED", "FAILED", "REFUNDED"].includes(status);
    const good = ["PAID", "DELIVERED"].includes(status);
    return (
        <Badge variant={bad ? "destructive" : good ? "default" : "outline"}>
            {status.replace(/_/g, " ")}
        </Badge>
    );
}