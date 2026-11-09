"use client";

import { useCallback, useState } from "react";
import { errorMessage } from "./errors";

/** Wraps an async call with pending + user-facing error state. Returns true on success. */
export function useMutationState<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: A): Promise<boolean> => {
      setPending(true);
      setError(null);
      try {
        await fn(...args);
        return true;
      } catch (err) {
        setError(errorMessage(err));
        return false;
      } finally {
        setPending(false);
      }
    },
    [fn],
  );

  return { run, pending, error, clearError: () => setError(null) };
}
