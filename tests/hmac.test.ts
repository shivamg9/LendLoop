import { describe, expect, it } from "vitest";
import { MAX_SKEW_SECONDS, hmacHex, signRequest, timingSafeEqual, verifyRequest } from "../convex/lib/hmac";

const SECRET = "test-secret";
const NOW = 1_800_000_000_000;
const BODY = JSON.stringify({ hello: "world" });

describe("hmacHex", () => {
  it("matches the RFC 4231 test case 2 vector", async () => {
    expect(await hmacHex("Jefe", "what do ya want for nothing?")).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });
});

describe("timingSafeEqual", () => {
  it("compares equal and unequal strings", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("signRequest / verifyRequest", () => {
  async function signed(body = BODY, at = NOW) {
    const headers = await signRequest(SECRET, body, at);
    return { timestamp: headers["X-LendLoop-Timestamp"], signature: headers["X-LendLoop-Signature"] };
  }

  it("signs timestamp + '.' + body as hex", async () => {
    const { timestamp, signature } = await signed();
    expect(timestamp).toBe(String(NOW / 1000));
    expect(signature).toBe(await hmacHex(SECRET, `${timestamp}.${BODY}`));
  });

  it("accepts a fresh, correctly signed request", async () => {
    const sig = await signed();
    expect(await verifyRequest({ secret: SECRET, rawBody: BODY, ...sig, nowMs: NOW })).toEqual({ ok: true });
  });

  it("accepts uppercase hex signatures", async () => {
    const sig = await signed();
    const result = await verifyRequest({ secret: SECRET, rawBody: BODY, ...sig, signature: sig.signature.toUpperCase(), nowMs: NOW });
    expect(result.ok).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const sig = await signed();
    const result = await verifyRequest({ secret: SECRET, rawBody: BODY.replace("world", "w0rld"), ...sig, nowMs: NOW });
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects the wrong secret", async () => {
    const sig = await signed();
    expect(await verifyRequest({ secret: "other", rawBody: BODY, ...sig, nowMs: NOW })).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects stale and future timestamps beyond the window", async () => {
    const sig = await signed();
    const late = NOW + (MAX_SKEW_SECONDS + 1) * 1000;
    const early = NOW - (MAX_SKEW_SECONDS + 1) * 1000;
    expect(await verifyRequest({ secret: SECRET, rawBody: BODY, ...sig, nowMs: late })).toEqual({ ok: false, reason: "stale_timestamp" });
    expect(await verifyRequest({ secret: SECRET, rawBody: BODY, ...sig, nowMs: early })).toEqual({ ok: false, reason: "stale_timestamp" });
  });

  it("accepts timestamps just inside the window", async () => {
    const sig = await signed();
    const result = await verifyRequest({ secret: SECRET, rawBody: BODY, ...sig, nowMs: NOW + MAX_SKEW_SECONDS * 1000 });
    expect(result.ok).toBe(true);
  });

  it("rejects missing or malformed headers", async () => {
    const sig = await signed();
    expect(await verifyRequest({ secret: SECRET, rawBody: BODY, timestamp: null, signature: sig.signature, nowMs: NOW })).toEqual({
      ok: false,
      reason: "missing_headers",
    });
    expect(await verifyRequest({ secret: SECRET, rawBody: BODY, timestamp: "abc", signature: sig.signature, nowMs: NOW })).toEqual({
      ok: false,
      reason: "stale_timestamp",
    });
  });

  it("binds the timestamp into the signature (no replay with a fresh timestamp)", async () => {
    const sig = await signed();
    const replayed = { timestamp: String(Number(sig.timestamp) + 60), signature: sig.signature };
    const result = await verifyRequest({ secret: SECRET, rawBody: BODY, ...replayed, nowMs: NOW + 60_000 });
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });
});
