import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import type { EventType } from "./outbox";

const MAX_ITEMS = 3;

export type ActivityItem =
  | { kind: "notification"; eventType: EventType; status: "pending" | "sent" | "failed"; at: number }
  | { kind: "reminder"; status: "sent" | "failed"; at: number };

/** Recent automation activity for one loan. Error details stay admin-only. */
export async function loanActivity(ctx: QueryCtx, loanId: Id<"loans">): Promise<ActivityItem[]> {
  const [events, reminders] = await Promise.all([
    ctx.db.query("automationEvents").withIndex("by_loan", (q) => q.eq("loanId", loanId)).order("desc").take(MAX_ITEMS),
    ctx.db.query("reminders").withIndex("by_loan", (q) => q.eq("loanId", loanId)).order("desc").take(MAX_ITEMS),
  ]);
  const items: ActivityItem[] = [
    ...events.map((e) => ({ kind: "notification" as const, eventType: e.eventType, status: e.status, at: e.sentAt ?? e._creationTime })),
    ...reminders.map((r) => ({ kind: "reminder" as const, status: r.status, at: r.sentAt })),
  ];
  return items.sort((a, b) => b.at - a.at).slice(0, MAX_ITEMS);
}
