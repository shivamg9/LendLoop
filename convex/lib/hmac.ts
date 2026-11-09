// HMAC-SHA256 request signing shared by Convex -> n8n and n8n -> Convex.
// signature = hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`)), timestamp in unix seconds.

export const TIMESTAMP_HEADER = "X-LendLoop-Timestamp";
export const SIGNATURE_HEADER = "X-LendLoop-Signature";
export const MAX_SKEW_SECONDS = 5 * 60;

const encoder = new TextEncoder();

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compares in time independent of where the first difference is. Length is not secret (always 64). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signRequest(secret: string, rawBody: string, nowMs: number = Date.now()) {
  const timestamp = Math.floor(nowMs / 1000).toString();
  const signature = await hmacHex(secret, `${timestamp}.${rawBody}`);
  return { [TIMESTAMP_HEADER]: timestamp, [SIGNATURE_HEADER]: signature };
}

export type VerifyResult = { ok: true } | { ok: false; reason: "missing_headers" | "stale_timestamp" | "bad_signature" };

export async function verifyRequest(params: {
  secret: string;
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  nowMs?: number;
}): Promise<VerifyResult> {
  const { secret, rawBody, timestamp, signature, nowMs = Date.now() } = params;
  if (!timestamp || !signature) return { ok: false, reason: "missing_headers" };
  if (!/^\d{1,12}$/.test(timestamp)) return { ok: false, reason: "stale_timestamp" };
  // Symmetric window also rejects timestamps from the future (clock games).
  if (Math.abs(Math.floor(nowMs / 1000) - Number(timestamp)) > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "stale_timestamp" };
  }
  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  return timingSafeEqual(expected, signature.toLowerCase()) ? { ok: true } : { ok: false, reason: "bad_signature" };
}
