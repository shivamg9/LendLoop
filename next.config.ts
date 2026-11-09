import type { NextConfig } from "next";

// cacheComponents is intentionally off: all app data is fetched client-side
// through Convex's reactive queries, so a prerendered static shell adds little
// and would force every Clerk session read behind extra Suspense boundaries.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
