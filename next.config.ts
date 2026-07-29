import type { NextConfig } from "next";

/**
 * NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN is inlined into the client bundle at
 * build time (next build always runs with NODE_ENV=production, unlike
 * next dev). Without it, src/lib/tenant.ts falls back to an ambiguous
 * label-count heuristic that misclassifies the root domain itself
 * (e.g. dental.ilmtech.uz, 3 labels) as a tenant subdomain. Fail the
 * build rather than ship that silently — see .env.example.
 */
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN
) {
  throw new Error(
    "NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN is not set. Without it, the root domain " +
      "gets misclassified as a tenant subdomain (see src/lib/tenant.ts, " +
      "resolveHostContext). Set it in .env.production before building. " +
      "See .env.example."
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
