"use client";

import { SignInButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import { PublicToolList } from "@/components/tools/PublicToolList";
import { Button } from "@/components/ui/Button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-emerald-800 px-6 py-12 text-white sm:px-10">
        <h1 className="text-4xl font-semibold tracking-tight">LendLoop</h1>
        <p className="mt-3 max-w-xl text-lg text-emerald-50">Borrow what you need. Lend what you don&apos;t.</p>
        <div className="mt-6">
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button variant="secondary">Sign in to lend or borrow</Button>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <Link href="/tools" className="inline-block rounded-md bg-white px-3 py-1.5 text-sm font-medium text-emerald-900">
              Browse tools →
            </Link>
          </Authenticated>
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold">Available tools</h2>
        <ErrorBoundary>
          <PublicToolList />
        </ErrorBoundary>
      </section>
    </div>
  );
}
