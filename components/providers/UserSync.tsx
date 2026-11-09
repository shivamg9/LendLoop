"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

/** Ensures a users row exists for the signed-in Clerk identity. */
export function UserSync() {
  const { isAuthenticated } = useConvexAuth();
  const syncMe = useMutation(api.users.syncMe);

  useEffect(() => {
    if (isAuthenticated) void syncMe();
  }, [isAuthenticated, syncMe]);

  return null;
}
