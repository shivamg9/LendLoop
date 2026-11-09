import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery } from "./_generated/server";
import { LIMITS } from "./lib/constants";
import { nextRetryDelayMs } from "./lib/retry";

export const getEvent = internalQuery({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, { eventId }) => await ctx.db.get(eventId),
});

/**
 * Records one delivery attempt. Retry scheduling happens here (not in the
 * action) so the attempt count and the next run are committed atomically.
 */
export const recordAttempt = internalMutation({
  args: {
    eventId: v.id("automationEvents"),
    ok: v.boolean(),
    retryable: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, ok, retryable, error }) => {
    const event = await ctx.db.get(eventId);
    if (!event || event.status !== "pending") return;
    const attempts = event.attempts + 1;

    if (ok) {
      await ctx.db.patch(eventId, { status: "sent", attempts, sentAt: Date.now(), lastError: undefined });
      return;
    }
    const lastError = error?.slice(0, LIMITS.errorMessage);
    const delay = retryable ? nextRetryDelayMs(attempts) : null;
    if (delay === null) {
      await ctx.db.patch(eventId, { status: "failed", attempts, lastError });
      return;
    }
    await ctx.db.patch(eventId, { attempts, lastError });
    await ctx.scheduler.runAfter(delay, internal.automation.deliver, { eventId });
  },
});
