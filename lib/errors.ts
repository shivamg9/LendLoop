import { ConvexError } from "convex/values";

/** Turns Convex errors into a message safe to show users. */
export function errorMessage(err: unknown): string {
  if (err instanceof ConvexError && typeof err.data === "object" && err.data && "message" in err.data) {
    return String(err.data.message);
  }
  return "Something went wrong. Please try again.";
}
