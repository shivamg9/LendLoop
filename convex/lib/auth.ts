import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { fail } from "./errors";

// Identity always comes from the verified JWT on ctx.auth, never from client args.

export async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function requireUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) fail("UNAUTHENTICATED", "You must be signed in.");
  return user;
}

export async function requireAdmin(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") fail("FORBIDDEN", "Admin access required.");
  return user;
}

export async function requireToolOwner(
  ctx: QueryCtx,
  toolId: Id<"tools">,
): Promise<{ user: Doc<"users">; tool: Doc<"tools"> }> {
  const user = await requireUser(ctx);
  const tool = await ctx.db.get(toolId);
  if (!tool) fail("NOT_FOUND", "Tool not found.");
  if (tool.ownerId !== user._id) fail("FORBIDDEN", "You can only manage your own tools.");
  return { user, tool };
}

export type LoanRole = "lender" | "borrower";

export async function requireLoanParty(
  ctx: QueryCtx,
  loanId: Id<"loans">,
  role: LoanRole,
): Promise<{ user: Doc<"users">; loan: Doc<"loans"> }> {
  const user = await requireUser(ctx);
  const loan = await ctx.db.get(loanId);
  if (!loan) fail("NOT_FOUND", "Loan not found.");
  const partyId = role === "lender" ? loan.lenderId : loan.borrowerId;
  if (partyId !== user._id) fail("FORBIDDEN", `Only the ${role} can do this.`);
  return { user, loan };
}

/** Parses the comma-separated ADMIN_EMAILS env var. */
export function isBootstrapAdmin(email: string, adminEmails: string | undefined): boolean {
  if (!adminEmails) return false;
  const normalized = email.trim().toLowerCase();
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
