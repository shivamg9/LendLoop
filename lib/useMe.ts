"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/** The signed-in user's row, or undefined while auth/sync is in flight. */
export function useMe() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.users.me, isAuthenticated ? {} : "skip");
}
