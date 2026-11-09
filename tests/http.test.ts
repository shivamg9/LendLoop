import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { signRequest } from "../convex/lib/hmac";
import { ALICE, BOB, TOOL, setup } from "./setup";

const SECRET = "http-test-secret";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-11-09T12:00:00Z") });
  vi.stubEnv("LENDLOOP_WEBHOOK_SECRET", SECRET);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

async function signedInit(method: "GET" | "POST", body = ""): Promise<RequestInit> {
  return { method, headers: { "Content-Type": "application/json", ...(await signRequest(SECRET, body)) }, body: method === "POST" ? body : undefined };
}

async function overdueLoan() {
  const ctx = await setup(ALICE, BOB);
  const toolId = await ctx.as(ALICE).mutation(api.tools.create, { input: TOOL });
  const loanId = await ctx.t.run(async (db) => {
    const [lender, borrower] = await Promise.all([
      db.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", ALICE.subject)).unique(),
      db.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", BOB.subject)).unique(),
    ]);
    return db.db.insert("loans", { toolId, lenderId: lender!._id, borrowerId: borrower!._id, startDate: "2026-11-01", endDate: "2026-11-05", status: "approved" });
  });
  return { ...ctx, loanId };
}

describe("signed HTTP endpoints", () => {
  it("rejects unsigned and tampered requests", async () => {
    const { t } = await setup();
    expect((await t.fetch("/overdue-loans", { method: "GET" })).status).toBe(401);
    const init = await signedInit("POST", JSON.stringify({ loanId: "x", status: "sent" }));
    const tampered = await t.fetch("/reminders", { ...init, body: JSON.stringify({ loanId: "y", status: "sent" }) });
    expect(tampered.status).toBe(401);
  });

  it("GET /overdue-loans returns only the minimal fields", async () => {
    const { t, loanId } = await overdueLoan();
    const res = await t.fetch("/overdue-loans", await signedInit("GET"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { loans: Record<string, unknown>[] };
    expect(body.loans).toEqual([
      { loanId, borrowerFirstName: "Bob", borrowerEmail: BOB.email, toolName: TOOL.name, endDate: "2026-11-05" },
    ]);
  });

  it("POST /reminders is idempotent per loan per day", async () => {
    const { t, loanId } = await overdueLoan();
    const body = JSON.stringify({ loanId, status: "sent" });

    const first = await t.fetch("/reminders", await signedInit("POST", body));
    const second = await t.fetch("/reminders", await signedInit("POST", body));
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(((await second.json()) as { created: boolean }).created).toBe(false);
    expect(await t.run((ctx) => ctx.db.query("reminders").collect())).toHaveLength(1);
  });

  it("POST /automation-failures validates and records the report", async () => {
    const { t } = await setup();
    expect((await t.fetch("/automation-failures", await signedInit("POST", "{}"))).status).toBe(400);
    const ok = await t.fetch("/automation-failures", await signedInit("POST", JSON.stringify({ workflowName: "WF", message: "boom" })));
    expect(ok.status).toBe(201);
    expect(await t.run((ctx) => ctx.db.query("automationFailures").collect())).toHaveLength(1);
  });
});
