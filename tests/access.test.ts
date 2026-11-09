import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import { ADMIN, ALICE, BOB, CAROL, TOOL, expectCode, modules, setup } from "./setup";

beforeEach(() => {
  // Fake timers keep scheduled webhook deliveries queued instead of firing real fetches.
  vi.useFakeTimers({ now: new Date("2026-11-09T12:00:00Z") });
  vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("users.syncMe", () => {
  it("grants admin only to verified ADMIN_EMAILS on first sync", async () => {
    const { as } = await setup(ADMIN, ALICE);
    expect((await as(ADMIN).query(api.users.me, {}))?.role).toBe("admin");
    expect((await as(ALICE).query(api.users.me, {}))?.role).toBe("user");
  });

  it("does not grant admin to an unverified email", async () => {
    const { as } = await setup({ ...ADMIN, emailVerified: false });
    expect((await as({ ...ADMIN, emailVerified: false }).query(api.users.me, {}))?.role).toBe("user");
  });

  it("rejects anonymous callers", async () => {
    const t = convexTest(schema, modules);
    await expectCode(t.mutation(api.users.syncMe, {}), "UNAUTHENTICATED");
  });
});

describe("tools", () => {
  it("public list exposes only id, name and category", async () => {
    const { t, as } = await setup(ALICE);
    await as(ALICE).mutation(api.tools.create, { input: TOOL });
    const [tool] = await t.query(api.tools.listPublic, {});
    expect(Object.keys(tool).sort()).toEqual(["_id", "category", "name"]);
  });

  it("requires sign-in for the full catalogue and for creating", async () => {
    const t = convexTest(schema, modules);
    await expectCode(t.query(api.tools.listWithAvailability, {}), "UNAUTHENTICATED");
    await expectCode(t.mutation(api.tools.create, { input: TOOL }), "UNAUTHENTICATED");
  });

  it("only the owner can edit or delete", async () => {
    const { as } = await setup(ALICE, BOB);
    const toolId = await as(ALICE).mutation(api.tools.create, { input: TOOL });
    await expectCode(as(BOB).mutation(api.tools.update, { toolId, input: { ...TOOL, name: "Mine now" } }), "FORBIDDEN");
    await expectCode(as(BOB).mutation(api.tools.remove, { toolId }), "FORBIDDEN");
    await as(ALICE).mutation(api.tools.update, { toolId, input: { ...TOOL, name: "Hammer drill" } });
  });

  it("enforces string length limits", async () => {
    const { as } = await setup(ALICE);
    await expectCode(as(ALICE).mutation(api.tools.create, { input: { ...TOOL, name: "x" } }), "INVALID_INPUT");
    await expectCode(as(ALICE).mutation(api.tools.create, { input: { ...TOOL, description: "d".repeat(501) } }), "INVALID_INPUT");
  });

  it("never exposes owner email in the signed-in catalogue", async () => {
    const { as } = await setup(ALICE, BOB);
    await as(ALICE).mutation(api.tools.create, { input: TOOL });
    const [tool] = await as(BOB).query(api.tools.listWithAvailability, {});
    expect(JSON.stringify(tool)).not.toContain(ALICE.email);
  });
});

describe("loans", () => {
  async function withTool() {
    const ctx = await setup(ALICE, BOB, CAROL);
    const toolId = await ctx.as(ALICE).mutation(api.tools.create, { input: TOOL });
    return { ...ctx, toolId };
  }

  it("cannot borrow your own tool", async () => {
    const { as, toolId } = await withTool();
    await expectCode(as(ALICE).mutation(api.loans.request, { toolId, startDate: "2026-11-10", endDate: "2026-11-11" }), "FORBIDDEN");
  });

  it("validates dates server-side", async () => {
    const { as, toolId } = await withTool();
    await expectCode(as(BOB).mutation(api.loans.request, { toolId, startDate: "2026-11-08", endDate: "2026-11-10" }), "INVALID_INPUT");
    await expectCode(as(BOB).mutation(api.loans.request, { toolId, startDate: "2026-11-10", endDate: "2026-12-20" }), "INVALID_INPUT");
  });

  it("only the lender can approve; approval auto-declines overlapping requests and blocks new ones", async () => {
    const { as, toolId } = await withTool();
    const bobLoan = await as(BOB).mutation(api.loans.request, { toolId, startDate: "2026-11-10", endDate: "2026-11-12" });
    const carolLoan = await as(CAROL).mutation(api.loans.request, { toolId, startDate: "2026-11-12", endDate: "2026-11-14" });

    await expectCode(as(BOB).mutation(api.loans.approve, { loanId: bobLoan }), "FORBIDDEN");
    await expectCode(as(CAROL).mutation(api.loans.approve, { loanId: bobLoan }), "FORBIDDEN");
    await as(ALICE).mutation(api.loans.approve, { loanId: bobLoan });

    const [carolView] = await as(CAROL).query(api.loans.myRequests, {});
    expect(carolView._id).toBe(carolLoan);
    expect(carolView.status).toBe("declined");
    await expectCode(as(CAROL).mutation(api.loans.request, { toolId, startDate: "2026-11-11", endDate: "2026-11-11" }), "CONFLICT");
  });

  it("only the borrower can cancel, and only while pending", async () => {
    const { as, toolId } = await withTool();
    const loanId = await as(BOB).mutation(api.loans.request, { toolId, startDate: "2026-11-10", endDate: "2026-11-12" });
    await expectCode(as(ALICE).mutation(api.loans.cancel, { loanId }), "FORBIDDEN");
    await as(BOB).mutation(api.loans.cancel, { loanId });
    await expectCode(as(BOB).mutation(api.loans.cancel, { loanId }), "CONFLICT");
  });

  it("only the lender can mark returned, and only approved loans", async () => {
    const { as, toolId } = await withTool();
    const loanId = await as(BOB).mutation(api.loans.request, { toolId, startDate: "2026-11-10", endDate: "2026-11-12" });
    await expectCode(as(ALICE).mutation(api.loans.markReturned, { loanId }), "CONFLICT");
    await as(ALICE).mutation(api.loans.approve, { loanId });
    await expectCode(as(BOB).mutation(api.loans.markReturned, { loanId }), "FORBIDDEN");
    await as(ALICE).mutation(api.loans.markReturned, { loanId });
  });

  it("writes a data-minimized outbox event for every status change", async () => {
    const { t, as, toolId } = await withTool();
    const loanId = await as(BOB).mutation(api.loans.request, { toolId, startDate: "2026-11-10", endDate: "2026-11-12" });
    await as(ALICE).mutation(api.loans.approve, { loanId });

    const events = await t.run((ctx) => ctx.db.query("automationEvents").collect());
    expect(events.map((e) => e.eventType)).toEqual(["loan.requested", "loan.approved"]);
    expect(events[0].payload.recipientEmail).toBe(ALICE.email);
    expect(events[1].payload).toEqual({
      eventType: "loan.approved",
      loanId,
      toolName: TOOL.name,
      recipientEmail: BOB.email,
      recipientFirstName: "Bob",
      status: "approved",
      startDate: "2026-11-10",
      endDate: "2026-11-12",
    });
  });
});

describe("admin", () => {
  it("rejects non-admins on every admin function", async () => {
    const { as } = await setup(ALICE);
    await expectCode(as(ALICE).query(api.admin.listUsers, {}), "FORBIDDEN");
    await expectCode(as(ALICE).query(api.admin.listLoans, {}), "FORBIDDEN");
    await expectCode(as(ALICE).query(api.admin.automationHealth, {}), "FORBIDDEN");
  });

  it("can toggle Trusted Lender and remove any listing", async () => {
    const { as } = await setup(ADMIN, ALICE);
    const alice = await as(ALICE).query(api.users.me, {});
    await expectCode(as(ALICE).mutation(api.admin.setTrustedLender, { userId: alice!._id, trusted: true }), "FORBIDDEN");
    await as(ADMIN).mutation(api.admin.setTrustedLender, { userId: alice!._id, trusted: true });
    expect((await as(ALICE).query(api.users.me, {}))?.trustedLender).toBe(true);

    const toolId = await as(ALICE).mutation(api.tools.create, { input: TOOL });
    await as(ADMIN).mutation(api.admin.removeTool, { toolId });
    expect(await as(ALICE).query(api.tools.listMine, {})).toEqual([]);
  });
});
