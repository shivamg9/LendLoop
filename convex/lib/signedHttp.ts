import { httpAction, type ActionCtx } from "../_generated/server";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifyRequest } from "./hmac";

const MAX_BODY_BYTES = 16 * 1024;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/**
 * Wraps an httpAction so the handler only runs for requests signed with the
 * shared secret. The raw body is verified before it is parsed.
 */
export function signedHttpAction(handler: (ctx: ActionCtx, rawBody: string) => Promise<Response>) {
  return httpAction(async (ctx, request) => {
    const secret = process.env.LENDLOOP_WEBHOOK_SECRET;
    if (!secret) return json({ error: "server_not_configured" }, 500);

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);

    const result = await verifyRequest({
      secret,
      rawBody,
      timestamp: request.headers.get(TIMESTAMP_HEADER),
      signature: request.headers.get(SIGNATURE_HEADER),
    });
    // The reason is safe to return: it reveals nothing about the secret and helps operators debug.
    if (!result.ok) return json({ error: "unauthorized", reason: result.reason }, 401);

    return handler(ctx, rawBody);
  });
}

export function parseJsonObject(rawBody: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(rawBody);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const optionalString = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value.length > 0 ? value.slice(0, max) : undefined;
