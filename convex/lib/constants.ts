// Shared between Convex functions and the UI so the two never drift.
export const CATEGORIES = ["power_tools", "garden", "kitchen", "camping", "cleaning", "other"] as const;
export const CONDITIONS = ["new", "good", "fair", "worn"] as const;
export const LOAN_STATUSES = ["pending", "approved", "declined", "cancelled", "returned"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  power_tools: "Power tools",
  garden: "Garden",
  kitchen: "Kitchen",
  camping: "Camping",
  cleaning: "Cleaning",
  other: "Other",
};

export const LIMITS = {
  toolName: { min: 2, max: 80 },
  toolDescription: { min: 0, max: 500 },
  maxLoanDays: 30,
  errorMessage: 1000,
} as const;
