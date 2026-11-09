// Pure loan rules: no ctx, no I/O, so they are unit-tested directly.
import { LIMITS, type LoanStatus } from "./constants";
import { inclusiveDays, isIsoDate } from "./dates";

export type DateRange = { startDate: string; endDate: string };

/** Returns a user-facing error message, or null when the range is valid. */
export function validateRequestDates({ startDate, endDate }: DateRange, today: string): string | null {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return "Dates must be valid YYYY-MM-DD dates.";
  if (startDate < today) return "Start date cannot be in the past.";
  if (endDate < startDate) return "End date must be on or after the start date.";
  if (inclusiveDays(startDate, endDate) > LIMITS.maxLoanDays) {
    return `Loans can be at most ${LIMITS.maxLoanDays} days.`;
  }
  return null;
}

/** Inclusive ranges: a loan ending on the 5th conflicts with one starting on the 5th. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

export function isOverdue(loan: DateRange & { status: LoanStatus }, today: string): boolean {
  return loan.status === "approved" && loan.endDate < today;
}

const TRANSITIONS: Record<LoanStatus, readonly LoanStatus[]> = {
  pending: ["approved", "declined", "cancelled"],
  approved: ["returned"],
  declined: [],
  cancelled: [],
  returned: [],
};

export function canTransition(from: LoanStatus, to: LoanStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
