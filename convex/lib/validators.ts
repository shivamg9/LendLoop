import { v, type Infer } from "convex/values";
import type { Category, Condition, LoanStatus } from "./constants";

// Kept in sync with constants.ts; the satisfies checks below fail to compile if they drift.
export const vCategory = v.union(
  v.literal("power_tools"),
  v.literal("garden"),
  v.literal("kitchen"),
  v.literal("camping"),
  v.literal("cleaning"),
  v.literal("other"),
);
export const vCondition = v.union(v.literal("new"), v.literal("good"), v.literal("fair"), v.literal("worn"));
export const vLoanStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("declined"),
  v.literal("cancelled"),
  v.literal("returned"),
);

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
true satisfies Same<Infer<typeof vCategory>, Category>;
true satisfies Same<Infer<typeof vCondition>, Condition>;
true satisfies Same<Infer<typeof vLoanStatus>, LoanStatus>;

export const vRole = v.union(v.literal("admin"), v.literal("user"));
export const vEventType = v.union(
  v.literal("loan.requested"),
  v.literal("loan.approved"),
  v.literal("loan.declined"),
  v.literal("loan.cancelled"),
  v.literal("loan.returned"),
);
export const vDeliveryStatus = v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"));
/** ISO calendar date, e.g. 2026-11-09. Format is checked in loanRules. */
export const vIsoDate = v.string();
