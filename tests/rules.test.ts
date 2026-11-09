import { describe, expect, it } from "vitest";
import { isBootstrapAdmin } from "../convex/lib/auth";
import { inclusiveDays, isIsoDate, todayIso } from "../convex/lib/dates";
import { canTransition, isOverdue, rangesOverlap, validateRequestDates } from "../convex/lib/loanRules";
import { isRetryableStatus, nextRetryDelayMs } from "../convex/lib/retry";

const TODAY = "2026-11-09";

describe("dates", () => {
  it("formats today in UTC", () => {
    expect(todayIso(Date.UTC(2026, 10, 9, 23, 59))).toBe(TODAY);
  });
  it("validates real calendar dates only", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-2-3")).toBe(false);
  });
  it("counts days inclusively", () => {
    expect(inclusiveDays(TODAY, TODAY)).toBe(1);
    expect(inclusiveDays("2026-11-01", "2026-11-30")).toBe(30);
  });
});

describe("validateRequestDates", () => {
  const check = (startDate: string, endDate: string) => validateRequestDates({ startDate, endDate }, TODAY);

  it("accepts a same-day loan starting today", () => expect(check(TODAY, TODAY)).toBeNull());
  it("rejects a start in the past", () => expect(check("2026-11-08", TODAY)).toMatch(/past/));
  it("rejects end before start", () => expect(check("2026-11-12", "2026-11-11")).toMatch(/on or after/));
  it("allows exactly 30 days", () => expect(check("2026-11-10", "2026-12-09")).toBeNull());
  it("rejects 31 days", () => expect(check("2026-11-10", "2026-12-10")).toMatch(/at most 30/));
  it("rejects malformed dates", () => expect(check("tomorrow", TODAY)).toMatch(/valid/));
});

describe("rangesOverlap", () => {
  const r = (startDate: string, endDate: string) => ({ startDate, endDate });
  it("treats touching ranges as overlapping (inclusive end)", () => {
    expect(rangesOverlap(r("2026-11-01", "2026-11-05"), r("2026-11-05", "2026-11-07"))).toBe(true);
  });
  it("detects containment", () => {
    expect(rangesOverlap(r("2026-11-01", "2026-11-30"), r("2026-11-10", "2026-11-11"))).toBe(true);
  });
  it("allows back-to-back ranges", () => {
    expect(rangesOverlap(r("2026-11-01", "2026-11-04"), r("2026-11-05", "2026-11-07"))).toBe(false);
  });
});

describe("isOverdue", () => {
  it("is only approved loans past their end date", () => {
    expect(isOverdue({ status: "approved", startDate: "2026-11-01", endDate: "2026-11-08" }, TODAY)).toBe(true);
    expect(isOverdue({ status: "approved", startDate: "2026-11-01", endDate: TODAY }, TODAY)).toBe(false);
    expect(isOverdue({ status: "returned", startDate: "2026-11-01", endDate: "2026-11-08" }, TODAY)).toBe(false);
  });
});

describe("canTransition", () => {
  it("follows the loan lifecycle", () => {
    expect(canTransition("pending", "approved")).toBe(true);
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("approved", "returned")).toBe(true);
    expect(canTransition("approved", "cancelled")).toBe(false);
    expect(canTransition("declined", "approved")).toBe(false);
    expect(canTransition("returned", "approved")).toBe(false);
  });
});

describe("retry policy", () => {
  it("backs off exponentially and stops after 3 attempts", () => {
    expect(nextRetryDelayMs(1)).toBe(2_000);
    expect(nextRetryDelayMs(2)).toBe(8_000);
    expect(nextRetryDelayMs(3)).toBeNull();
  });
  it("retries server errors, timeouts and rate limits only", () => {
    expect([500, 503, 408, 429].every(isRetryableStatus)).toBe(true);
    expect([400, 401, 404].some(isRetryableStatus)).toBe(false);
  });
});

describe("isBootstrapAdmin", () => {
  it("matches case-insensitively in a comma-separated list", () => {
    expect(isBootstrapAdmin("Admin@Example.com", " other@x.com , admin@example.com")).toBe(true);
    expect(isBootstrapAdmin("someone@example.com", "admin@example.com")).toBe(false);
    expect(isBootstrapAdmin("admin@example.com", undefined)).toBe(false);
    expect(isBootstrapAdmin("admin@example.com", "")).toBe(false);
  });
});
