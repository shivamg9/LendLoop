import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireToolOwner, requireUser } from "./lib/auth";
import { todayIso } from "./lib/dates";
import { cleanToolInput, vToolInput } from "./lib/toolInput";
import { removeTool } from "./lib/toolRemoval";
import { vCategory } from "./lib/validators";

const PUBLIC_LIMIT = 200;

/**
 * Public, unauthenticated. Returns ONLY id, name and category: owner and
 * description never leave the server for anonymous visitors.
 */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db.query("tools").order("desc").take(PUBLIC_LIMIT);
    return tools.map((t) => ({ _id: t._id, name: t.name, category: t.category }));
  },
});

export type Availability = { state: "available" } | { state: "on_loan"; until: string };

async function availabilityOf(ctx: QueryCtx, tool: Doc<"tools">, today: string): Promise<Availability> {
  const approved = await ctx.db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", tool._id).eq("status", "approved"))
    .collect();
  const current = approved.find((l) => l.startDate <= today);
  return current ? { state: "on_loan", until: current.endDate } : { state: "available" };
}

/** Signed-in catalogue. Exposes the owner's display name and trust badge, never their email. */
export const listWithAvailability = query({
  args: { category: v.optional(vCategory) },
  handler: async (ctx, { category }) => {
    const me = await requireUser(ctx);
    const tools = category
      ? await ctx.db.query("tools").withIndex("by_category", (q) => q.eq("category", category)).collect()
      : await ctx.db.query("tools").order("desc").collect();
    const today = todayIso();

    return await Promise.all(
      tools.map(async (tool) => {
        const owner = await ctx.db.get(tool.ownerId);
        return {
          _id: tool._id,
          name: tool.name,
          category: tool.category,
          condition: tool.condition,
          description: tool.description,
          isMine: tool.ownerId === me._id,
          owner: { name: owner?.name ?? "Unknown", trustedLender: owner?.trustedLender ?? false },
          availability: await availabilityOf(ctx, tool, today),
        };
      }),
    );
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const tools = await ctx.db.query("tools").withIndex("by_owner", (q) => q.eq("ownerId", me._id)).collect();
    const today = todayIso();
    return await Promise.all(tools.map(async (t) => ({ ...t, availability: await availabilityOf(ctx, t, today) })));
  },
});

export const create = mutation({
  args: { input: vToolInput },
  handler: async (ctx, { input }) => {
    const me = await requireUser(ctx);
    return await ctx.db.insert("tools", { ...cleanToolInput(input), ownerId: me._id });
  },
});

export const update = mutation({
  args: { toolId: v.id("tools"), input: vToolInput },
  handler: async (ctx, { toolId, input }) => {
    await requireToolOwner(ctx, toolId);
    await ctx.db.patch(toolId, cleanToolInput(input));
  },
});

export const remove = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const { tool } = await requireToolOwner(ctx, toolId);
    await removeTool(ctx, tool);
  },
});
