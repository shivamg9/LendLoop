import { v } from "convex/values";
import { CATEGORIES, CONDITIONS, LOAN_STATUSES } from "./constants";

const literals = <T extends readonly [string, string, ...string[]]>(values: T) => {
  const [a, b, ...rest] = values;
  return v.union(v.literal(a), v.literal(b), ...rest.map((x) => v.literal(x)));
};

export const vCategory = literals(CATEGORIES);
export const vCondition = literals(CONDITIONS);
export const vLoanStatus = literals(LOAN_STATUSES);
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
