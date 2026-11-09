"use client";

import { SignInButton } from "@clerk/nextjs";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { useMe } from "@/lib/useMe";

/** Renders children only once Convex has a verified identity AND the users row exists. */
export function AuthGate({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  return (
    <>
      <AuthLoading>
        <LoadingState />
      </AuthLoading>
      <Unauthenticated>
        <EmptyState title="Please sign in to continue">
          <SignInButton mode="modal">
            <Button className="mt-2">Sign in</Button>
          </SignInButton>
        </EmptyState>
      </Unauthenticated>
      <Authenticated>
        <SyncedUser adminOnly={adminOnly}>{children}</SyncedUser>
      </Authenticated>
    </>
  );
}

function SyncedUser({ children, adminOnly }: { children: ReactNode; adminOnly: boolean }) {
  const me = useMe();
  if (!me) return <LoadingState label="Setting up your account…" />;
  if (adminOnly && me.role !== "admin") {
    return <EmptyState title="Admins only">You don&apos;t have access to this page.</EmptyState>;
  }
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
