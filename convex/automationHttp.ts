import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { todayIso } from "./lib/dates";
import { LIMITS } from "./lib/constants";

// Internal functions backing convex/http.ts. Only reachable through signed HTTP requests.

const MAX_OVERDUE_BATCH = 500;

export const listOverdue = internalQuery({
  args: {},
  handler: async (ctx) => {
    const today = todayIso();
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status_endDate", (q) => q.eq("status", "approved").lt("endDate", today))
      .take(MAX_OVERDUE_BATCH);

    const rows = await Promise.all(
      loans.map(async (loan) => {
        const [borrower, tool] = await Promise.all([ctx.db.get(loan.borrowerId), ctx.db.get(loan.toolId)]);
        if (!borrower) return null;
        return {
          loanId: loan._id,
          borrowerFirstName: borrower.name.split(" ")[0],
          borrowerEmail: borrower.email,
          toolName: tool?.name ?? "a tool",
          endDate: loan.endDate,
        };
      }),
    );
    return { date: today, loans: rows.filter((r) => r !== null) };
  },
});

/**
 * Idempotent: the key is built server-side from loanId + today's date, so a
 * retried or duplicated POST returns the existing row instead of inserting.
 */
export const recordReminder = internalMutation({
  args: { loanId: v.string(), status: v.union(v.literal("sent"), v.literal("failed")) },
  handler: async (ctx, { loanId: rawLoanId, status }) => {
    const loanId = ctx.db.normalizeId("loans", rawLoanId);
    const loan = loanId ? await ctx.db.get(loanId) : null;
    if (!loanId || !loan) return { kind: "not_found" as const };

    const idempotencyKey = `${loanId}:${todayIso()}`;
    const existing = await ctx.db.query("reminders").withIndex("by_key", (q) => q.eq("idempotencyKey", idempotencyKey)).unique();
    if (existing) return { kind: "existing" as const, reminder: existing };

    const id = await ctx.db.insert("reminders", { idempotencyKey, loanId, status, sentAt: Date.now() });
    return { kind: "created" as const, reminder: await ctx.db.get(id) };
  },
});

export const recordFailure = internalMutation({
  args: {
    workflowName: v.string(),
    nodeName: v.optional(v.string()),
    message: v.string(),
    executionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("automationFailures", {
      ...args,
      workflowName: args.workflowName.slice(0, 200),
      message: args.message.slice(0, LIMITS.errorMessage),
    });
  },
});
