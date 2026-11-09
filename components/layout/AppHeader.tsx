"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useMe } from "@/lib/useMe";

const NAV = [
  { href: "/tools", label: "Tools" },
  { href: "/my/listings", label: "My listings" },
  { href: "/my/requests", label: "My requests" },
  { href: "/my/incoming", label: "Incoming" },
];

export function AppHeader() {
  const pathname = usePathname();
  const me = useMe();
  const links = me?.role === "admin" ? [...NAV, { href: "/admin", label: "Admin" }] : NAV;

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-emerald-800">
          LendLoop
        </Link>
        <Authenticated>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 ${
                  pathname.startsWith(href) ? "bg-stone-100 font-medium text-stone-900" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </Authenticated>
        <div className="ml-auto">
          <Authenticated>
            <UserButton />
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}
