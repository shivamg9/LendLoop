import { Badge, type Tone } from "@/components/ui/Badge";
import type { LoanStatus } from "@/convex/lib/constants";

const TONE: Record<LoanStatus, Tone> = {
  pending: "amber",
  approved: "green",
  declined: "neutral",
  cancelled: "neutral",
  returned: "blue",
};

export function LoanStatusBadge({ status, overdue }: { status: LoanStatus; overdue: boolean }) {
  if (overdue) return <Badge tone="red">Overdue</Badge>;
  return <Badge tone={TONE[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}
