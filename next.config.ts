import type { NextConfig } from "next";

/**
 * NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN is inlined into the client bundle at
 * build time (next build always runs with NODE_ENV=production, unlike
 * next dev). Without it, or with a malformed value (protocol, trailing
 * slash, port, whitespace), src/lib/tenant.ts either falls back to an
 * ambiguous label-count heuristic or simply never matches the intended
 * domain — both end up misclassifying the root domain itself (e.g.
 * dental.ilmtech.uz, 3 labels) as a tenant subdomain. Fail the build
 * rather than ship that silently — see .env.example.
 */
const ROOT_DOMAIN_FORMAT =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

if (process.env.NODE_ENV === "production") {
  const rootDomain = process.env.NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN;

  if (!rootDomain) {
    throw new Error(
      "NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN is not set. Without it, the root domain " +
        "gets misclassified as a tenant subdomain (see src/lib/tenant.ts, " +
        "resolveHostContext). Set it in .env.production before building. " +
        "See .env.example."
    );
  }

  if (!ROOT_DOMAIN_FORMAT.test(rootDomain)) {
    throw new Error(
      `NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN is set to "${rootDomain}", which is not a ` +
        'bare domain. Expected format: "dental.ilmtech.uz" — no protocol ' +
        '("https://"), no trailing slash, no port, no whitespace. Fix it in ' +
        ".env.production. See .env.example."
    );
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
