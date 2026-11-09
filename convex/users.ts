import { mutation, query } from "./_generated/server";
import { getCurrentUser, isBootstrapAdmin } from "./lib/auth";
import { fail } from "./lib/errors";

/**
 * Upserts the caller from their Clerk identity. Takes no args on purpose:
 * everything (including role) is derived server-side, so a client cannot
 * choose its own id, email or role.
 */
export const syncMe = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) fail("UNAUTHENTICATED", "You must be signed in.");
    if (!identity.email) fail("INVALID_INPUT", "Your account has no email address.");

    const email = identity.email.toLowerCase();
    const name = (identity.name ?? identity.givenName ?? email.split("@")[0]).slice(0, 100);
    const existing = await getCurrentUser(ctx);

    if (existing) {
      // Role is never touched after the first sync; admins change trust via admin.ts.
      if (existing.email !== email || existing.name !== name) {
        await ctx.db.patch(existing._id, { email, name });
      }
      return existing._id;
    }

    // Only a verified email may claim a bootstrap admin address.
    const isAdmin = identity.emailVerified === true && isBootstrapAdmin(email, process.env.ADMIN_EMAILS);
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email,
      name,
      role: isAdmin ? "admin" : "user",
      trustedLender: false,
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return { _id: user._id, name: user.name, email: user.email, role: user.role, trustedLender: user.trustedLender };
  },
});
