import { ConvexError } from "convex/values";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "CONFLICT";

/** Throws a ConvexError whose data reaches the client, so the UI can show a precise message. */
export function fail(code: ErrorCode, message: string): never {
  throw new ConvexError({ code, message });
}

export function assertLength(field: string, value: string, min: number, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    fail("INVALID_INPUT", `${field} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
}
