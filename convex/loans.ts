import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { loanActivity } from "./lib/activity";
import { requireLoanParty, requireUser } from "./lib/auth";
import { todayIso } from "./lib/dates";
import { fail } from "./lib/errors";
import { isOverdue, rangesOverlap, validateRequestDates } from "./lib/loanRules";
import { findApprovedOverlap, loansForTool, transition } from "./lib/loanStore";
import { enqueueLoanEvent } from "./lib/outbox";
import { vIsoDate } from "./lib/validators";

export const request = mutation({
  args: { toolId: v.id("tools"), startDate: vIsoDate, endDate: vIsoDate },
  handler: async (ctx, { toolId, startDate, endDate }) => {
    const me = await requireUser(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) fail("NOT_FOUND", "Tool not found.");
    if (tool.ownerId === me._id) fail("FORBIDDEN", "You cannot borrow your own tool.");

    const range = { startDate, endDate };
    const dateError = validateRequestDates(range, todayIso());
    if (dateError) fail("INVALID_INPUT", dateError);
    if (await findApprovedOverlap(ctx, toolId, range)) {
      fail("CONFLICT", "This tool is already booked for some of those dates.");
    }
    const myPending = await loansForTool(ctx, toolId, "pending");
    if (myPending.some((l) => l.borrowerId === me._id && rangesOverlap(l, range))) {
      fail("CONFLICT", "You already have a pending request for these dates.");
    }

    const loanId = await ctx.db.insert("loans", {
      toolId,
      lenderId: tool.ownerId,
      borrowerId: me._id,
      startDate,
      endDate,
      status: "pending",
    });
    const loan = await ctx.db.get(loanId);
    if (loan) await enqueueLoanEvent(ctx, loan);
    return loanId;
  },
});

export const approve = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { loan } = await requireLoanParty(ctx, loanId, "lender");
    if (loan.status !== "pending") fail("CONFLICT", `This request is already ${loan.status}.`);
    if (loan.startDate < todayIso()) fail("CONFLICT", "The requested start date has passed. Decline it instead.");
    // Re-checked here: Convex mutations are serializable, so this check and the
    // patch below are atomic and two approvals can never both succeed.
    if (await findApprovedOverlap(ctx, loan.toolId, loan)) {
      fail("CONFLICT", "Another approved loan overlaps these dates.");
    }
    await transition(ctx, loan, "approved");

    const conflicting = (await loansForTool(ctx, loan.toolId, "pending")).filter(
      (other) => other._id !== loan._id && rangesOverlap(other, loan),
    );
    for (const other of conflicting) await transition(ctx, other, "declined");
  },
});

export const decline = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { loan } = await requireLoanParty(ctx, loanId, "lender");
    await transition(ctx, loan, "declined");
  },
});

export const cancel = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { loan } = await requireLoanParty(ctx, loanId, "borrower");
    await transition(ctx, loan, "cancelled");
  },
});

export const markReturned = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const { loan } = await requireLoanParty(ctx, loanId, "lender");
    await transition(ctx, loan, "returned");
  },
});

async function toLoanView(ctx: QueryCtx, loan: Doc<"loans">, counterpartId: Doc<"users">["_id"], today: string) {
  const [tool, counterpart] = await Promise.all([ctx.db.get(loan.toolId), ctx.db.get(counterpartId)]);
  return {
    _id: loan._id,
    _creationTime: loan._creationTime,
    toolName: tool?.name ?? "Deleted tool",
    startDate: loan.startDate,
    endDate: loan.endDate,
    status: loan.status,
    overdue: isOverdue(loan, today),
    counterpart: { name: counterpart?.name ?? "Unknown", trustedLender: counterpart?.trustedLender ?? false },
    activity: await loanActivity(ctx, loan._id),
  };
}

export const myRequests = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const loans = await ctx.db.query("loans").withIndex("by_borrower", (q) => q.eq("borrowerId", me._id)).order("desc").collect();
    const today = todayIso();
    return await Promise.all(loans.map((l) => toLoanView(ctx, l, l.lenderId, today)));
  },
});

export const incoming = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const loans = await ctx.db.query("loans").withIndex("by_lender", (q) => q.eq("lenderId", me._id)).order("desc").collect();
    const today = todayIso();
    return await Promise.all(loans.map((l) => toLoanView(ctx, l, l.borrowerId, today)));
  },
});
