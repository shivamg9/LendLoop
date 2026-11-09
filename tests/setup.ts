import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { expect } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

export const modules = import.meta.glob("../convex/**/*.*s");

export type Identity = { subject: string; email: string; name: string; emailVerified?: boolean };

export const ALICE: Identity = { subject: "user_alice", email: "alice@example.com", name: "Alice Lender", emailVerified: true };
export const BOB: Identity = { subject: "user_bob", email: "bob@example.com", name: "Bob Borrower", emailVerified: true };
export const CAROL: Identity = { subject: "user_carol", email: "carol@example.com", name: "Carol Third", emailVerified: true };
export const ADMIN: Identity = { subject: "user_admin", email: "admin@example.com", name: "Ada Admin", emailVerified: true };

export const TOOL = { name: "Cordless drill", category: "power_tools", condition: "good", description: "18V" } as const;

/** Fresh in-memory deployment with signed-in, synced users. */
export async function setup(...identities: Identity[]) {
  const t = convexTest(schema, modules);
  const as = Object.fromEntries(
    identities.map((id) => [id.subject, t.withIdentity(id)]),
  ) as Record<string, ReturnType<typeof t.withIdentity>>;
  for (const id of identities) await as[id.subject].mutation(api.users.syncMe, {});
  return { t, as: (id: Identity) => as[id.subject] };
}

export async function expectCode(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err, `expected ${code}`).toBeInstanceOf(ConvexError);
  expect((err as ConvexError<{ code: string }>).data.code).toBe(code);
}
