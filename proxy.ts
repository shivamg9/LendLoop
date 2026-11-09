import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Optimistic redirect only; real authorization is enforced inside Convex functions.
const isProtectedRoute = createRouteMatcher(["/tools(.*)", "/my(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
