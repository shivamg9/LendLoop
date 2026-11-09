import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Issuer URL of the Clerk JWT template named "convex".
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
