import type { ActivityItem } from "@/convex/lib/activity";
import type { EventType } from "@/convex/lib/outbox";
import { timeAgo } from "@/lib/format";

const NOTIFICATION_LABEL: Record<EventType, string> = {
  "loan.requested": "Request notification",
  "loan.approved": "Approval notification",
  "loan.declined": "Decline notification",
  "loan.cancelled": "Cancellation notification",
  "loan.returned": "Return confirmation",
};

const STATUS_TEXT = { pending: "sending…", sent: "sent", failed: "failed to send" } as const;

function describe(item: ActivityItem): string {
  const label = item.kind === "reminder" ? "Overdue reminder" : NOTIFICATION_LABEL[item.eventType];
  const when = item.status === "pending" ? "" : ` ${timeAgo(item.at)}`;
  return `${label} ${STATUS_TEXT[item.status]}${when}`;
}

export function ActivityLine({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) return null;
  return (
    <ul className="mt-3 space-y-0.5 border-t border-stone-100 pt-2 text-xs text-stone-500" aria-label="Automation activity">
      {activity.map((item, i) => (
        <li key={i} className={item.status === "failed" ? "text-red-700" : undefined}>
          ⟳ {describe(item)}
        </li>
      ))}
    </ul>
  );
}
