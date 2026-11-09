import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import type { Category, Condition, LoanStatus } from "./lib/constants";
import { todayIso } from "./lib/dates";

const DAY_MS = 86_400_000;
const offsetDate = (days: number) => todayIso(Date.now() + days * DAY_MS);

const USERS = [
  { key: "maya", name: "Maya Patel", trustedLender: true },
  { key: "leo", name: "Leo Fischer", trustedLender: false },
  { key: "sam", name: "Sam Okafor", trustedLender: false },
] as const;

const TOOLS: { owner: (typeof USERS)[number]["key"]; name: string; category: Category; condition: Condition; description: string }[] = [
  { owner: "maya", name: "Cordless drill", category: "power_tools", condition: "good", description: "18V with two batteries and a bit set." },
  { owner: "maya", name: "Pressure washer", category: "cleaning", condition: "fair", description: "Great for decks and patios." },
  { owner: "leo", name: "Two-person tent", category: "camping", condition: "new", description: "Lightweight, packs small." },
  { owner: "leo", name: "Hedge trimmer", category: "garden", condition: "worn", description: "Works fine, blade could use sharpening." },
  { owner: "sam", name: "Stand mixer", category: "kitchen", condition: "good", description: "With dough hook and whisk." },
];

const LOANS: { tool: number; borrower: (typeof USERS)[number]["key"]; from: number; to: number; status: LoanStatus }[] = [
  { tool: 0, borrower: "leo", from: -10, to: -3, status: "approved" }, // overdue -> exercises the reminder workflow
  { tool: 2, borrower: "sam", from: 0, to: 4, status: "approved" },
  { tool: 4, borrower: "maya", from: 2, to: 5, status: "pending" },
  { tool: 3, borrower: "sam", from: -20, to: -15, status: "returned" },
];

/**
 * Dev-only demo data. Internal (not callable from clients) and additionally
 * refuses to run unless the deployment sets ALLOW_SEED=true.
 * Run: npx convex env set ALLOW_SEED true && npx convex run seed:run
 * Inserts rows directly, so it bypasses the outbox (no notifications for demo data).
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.ALLOW_SEED !== "true") throw new Error("Seeding disabled. Set ALLOW_SEED=true on a dev deployment.");
    const already = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", "seed_maya")).unique();
    if (already) return "Seed data already present.";

    const userIds = {} as Record<(typeof USERS)[number]["key"], Id<"users">>;
    for (const u of USERS) {
      userIds[u.key] = await ctx.db.insert("users", {
        clerkId: `seed_${u.key}`,
        email: `${u.key}@example.com`,
        name: u.name,
        role: "user",
        trustedLender: u.trustedLender,
      });
    }
    const toolIds: Id<"tools">[] = [];
    for (const { owner, ...tool } of TOOLS) {
      toolIds.push(await ctx.db.insert("tools", { ...tool, ownerId: userIds[owner] }));
    }
    for (const loan of LOANS) {
      const tool = TOOLS[loan.tool];
      await ctx.db.insert("loans", {
        toolId: toolIds[loan.tool],
        lenderId: userIds[tool.owner],
        borrowerId: userIds[loan.borrower],
        startDate: offsetDate(loan.from),
        endDate: offsetDate(loan.to),
        status: loan.status,
      });
    }
    return `Seeded ${USERS.length} users, ${TOOLS.length} tools, ${LOANS.length} loans.`;
  },
});
