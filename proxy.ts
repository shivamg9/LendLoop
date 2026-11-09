import { clerkMiddleware } from "@clerk/nextjs/server";

// Only establishes the Clerk session. Following Clerk's resource-based guidance,
// there is no path matching here: every Convex function enforces auth itself,
// and protected pages render a sign-in prompt via <AuthGate>.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
