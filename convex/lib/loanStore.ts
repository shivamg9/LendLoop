import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { LoanStatus } from "./constants";
import { fail } from "./errors";
import { canTransition, rangesOverlap, type DateRange } from "./loanRules";

export async function loansForTool(ctx: QueryCtx, toolId: Id<"tools">, status: LoanStatus) {
  return await ctx.db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", toolId).eq("status", status))
    .collect();
}

export async function findApprovedOverlap(
  ctx: QueryCtx,
  toolId: Id<"tools">,
  range: DateRange,
): Promise<Doc<"loans"> | undefined> {
  const approved = await loansForTool(ctx, toolId, "approved");
  return approved.find((l) => rangesOverlap(l, range));
}

/** Single choke point for status changes so illegal transitions are impossible. */
export async function transition(ctx: MutationCtx, loan: Doc<"loans">, to: LoanStatus): Promise<Doc<"loans">> {
  if (!canTransition(loan.status, to)) {
    fail("CONFLICT", `Cannot change a ${loan.status} request to ${to}.`);
  }
  const now = Date.now();
  const patch = to === "returned" ? { status: to, returnedAt: now } : { status: to, decidedAt: now };
  await ctx.db.patch(loan._id, patch);
  return { ...loan, ...patch };
}
