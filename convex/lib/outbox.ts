import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { LoanStatus } from "./constants";

export type EventType = Doc<"automationEvents">["eventType"];

const EVENT_FOR_STATUS: Record<LoanStatus, EventType> = {
  pending: "loan.requested",
  approved: "loan.approved",
  declined: "loan.declined",
  cancelled: "loan.cancelled",
  returned: "loan.returned",
};

/**
 * Writes an outbox row in the caller's transaction and schedules delivery.
 * If the mutation rolls back, neither the row nor the scheduled job exist,
 * so a notification can never describe a state change that didn't happen.
 */
export async function enqueueLoanEvent(ctx: MutationCtx, loan: Doc<"loans">): Promise<void> {
  const eventType = EVENT_FOR_STATUS[loan.status];
  // The borrower acted (request/cancel) -> tell the lender; otherwise tell the borrower.
  const recipientId = eventType === "loan.requested" || eventType === "loan.cancelled" ? loan.lenderId : loan.borrowerId;
  const [recipient, tool] = await Promise.all([ctx.db.get(recipientId), ctx.db.get(loan.toolId)]);
  if (!recipient) return;

  const eventId = await ctx.db.insert("automationEvents", {
    eventType,
    loanId: loan._id,
    payload: {
      eventType,
      loanId: loan._id,
      toolName: tool?.name ?? "a tool",
      recipientEmail: recipient.email,
      recipientFirstName: recipient.name.split(" ")[0],
      status: loan.status,
      startDate: loan.startDate,
      endDate: loan.endDate,
    },
    status: "pending",
    attempts: 0,
  });
  await ctx.scheduler.runAfter(0, internal.automation.deliver, { eventId });
}
