export const MAX_DELIVERY_ATTEMPTS = 3;
const BASE_DELAY_MS = 2_000;

/** Exponential backoff (2s, 8s, ...). Returns null once attempts are exhausted. */
export function nextRetryDelayMs(attemptsSoFar: number): number | null {
  if (attemptsSoFar >= MAX_DELIVERY_ATTEMPTS) return null;
  return BASE_DELAY_MS * 4 ** (attemptsSoFar - 1);
}

/** 4xx means our request is wrong (bad signature, bad payload): retrying won't help. */
export function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}
