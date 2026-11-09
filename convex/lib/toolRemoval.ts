import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { fail } from "./errors";

/**
 * Shared by owner deletion and admin removal. Refuses while an approved loan
 * is outstanding (the tool is physically with someone); pending requests are
 * declined so borrowers aren't left waiting on a tool that no longer exists.
 */
export async function removeTool(ctx: MutationCtx, tool: Doc<"tools">): Promise<Doc<"loans">[]> {
  const approved = await ctx.db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", tool._id).eq("status", "approved"))
    .first();
  if (approved) fail("CONFLICT", "This tool has an active loan. Mark it returned first.");

  const pending = await ctx.db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", tool._id).eq("status", "pending"))
    .collect();
  const now = Date.now();
  for (const loan of pending) {
    await ctx.db.patch(loan._id, { status: "declined", decidedAt: now });
  }
  await ctx.db.delete(tool._id);
  return pending;
}
