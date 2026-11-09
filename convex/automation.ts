import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { signRequest } from "./lib/hmac";
import { isRetryableStatus } from "./lib/retry";

const REQUEST_TIMEOUT_MS = 10_000;

/** Delivers one outbox event to the n8n webhook. Scheduled only; never callable from clients. */
export const deliver = internalAction({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.runQuery(internal.automationInternal.getEvent, { eventId });
    if (!event || event.status !== "pending") return;

    const url = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.LENDLOOP_WEBHOOK_SECRET;
    if (!url || !secret) {
      await ctx.runMutation(internal.automationInternal.recordAttempt, {
        eventId,
        ok: false,
        retryable: false,
        error: "N8N_WEBHOOK_URL or LENDLOOP_WEBHOOK_SECRET is not configured",
      });
      return;
    }

    const rawBody = JSON.stringify({ eventId, ...event.payload });
    let result: { ok: boolean; retryable: boolean; error?: string };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await signRequest(secret, rawBody)) },
        body: rawBody,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      result = res.ok
        ? { ok: true, retryable: false }
        : { ok: false, retryable: isRetryableStatus(res.status), error: `HTTP ${res.status}` };
    } catch (err) {
      // Network errors and timeouts are transient by nature.
      result = { ok: false, retryable: true, error: err instanceof Error ? err.message : String(err) };
    }
    await ctx.runMutation(internal.automationInternal.recordAttempt, { eventId, ...result });
  },
});
