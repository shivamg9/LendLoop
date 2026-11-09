import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { todayIso } from "./lib/dates";
import { fail } from "./lib/errors";
import { isOverdue } from "./lib/loanRules";
import { removeTool as removeToolAndDeclinePending } from "./lib/toolRemoval";

const PAGE = 200;

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").order("desc").take(PAGE);
    return users.map(({ _id, name, email, role, trustedLender }) => ({ _id, name, email, role, trustedLender }));
  },
});

export const setTrustedLender = mutation({
  args: { userId: v.id("users"), trusted: v.boolean() },
  handler: async (ctx, { userId, trusted }) => {
    await requireAdmin(ctx);
    if (!(await ctx.db.get(userId))) fail("NOT_FOUND", "User not found.");
    await ctx.db.patch(userId, { trustedLender: trusted });
  },
});

export const listTools = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const tools = await ctx.db.query("tools").order("desc").take(PAGE);
    return await Promise.all(
      tools.map(async (t) => ({ _id: t._id, name: t.name, category: t.category, ownerName: (await ctx.db.get(t.ownerId))?.name ?? "Unknown" })),
    );
  },
});

export const removeTool = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    await requireAdmin(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) fail("NOT_FOUND", "Tool not found.");
    await removeToolAndDeclinePending(ctx, tool);
  },
});

export const listLoans = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const loans = await ctx.db.query("loans").order("desc").take(PAGE);
    const today = todayIso();
    return await Promise.all(
      loans.map(async (l) => {
        const [tool, lender, borrower] = await Promise.all([ctx.db.get(l.toolId), ctx.db.get(l.lenderId), ctx.db.get(l.borrowerId)]);
        return {
          _id: l._id,
          toolName: tool?.name ?? "Deleted tool",
          lenderName: lender?.name ?? "Unknown",
          borrowerName: borrower?.name ?? "Unknown",
          startDate: l.startDate,
          endDate: l.endDate,
          status: l.status,
          overdue: isOverdue(l, today),
        };
      }),
    );
  },
});

/** Delivery health: failed outbox rows and failures reported by the n8n error workflow. */
export const automationHealth = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [failedEvents, failures] = await Promise.all([
      ctx.db.query("automationEvents").withIndex("by_status", (q) => q.eq("status", "failed")).order("desc").take(50),
      ctx.db.query("automationFailures").order("desc").take(50),
    ]);
    return {
      failedEvents: failedEvents.map((e) => ({
        _id: e._id,
        at: e._creationTime,
        eventType: e.eventType,
        attempts: e.attempts,
        lastError: e.lastError ?? null,
      })),
      workflowFailures: failures.map((f) => ({
        _id: f._id,
        at: f._creationTime,
        workflowName: f.workflowName,
        nodeName: f.nodeName ?? null,
        message: f.message,
        executionId: f.executionId ?? null,
      })),
    };
  },
});
