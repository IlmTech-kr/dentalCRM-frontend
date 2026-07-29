/**
 * Edge-safe host/tenant resolution — single source of truth for both
 * proxy.ts (Edge runtime) and browser code (via tenant.client.ts).
 * No `window` access here, no Node-only APIs.
 */

export const SUPER_ADMIN_SUBDOMAIN = "admin";

export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www",
  "app",
  "api",
  "dashboard",
  SUPER_ADMIN_SUBDOMAIN,
]);

export const ROOT_ALLOWED_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/register",
  "/login",
  "/forgot-password",
  "/tariffs",
  "/subdomains",
]);

export type HostContext =
  | { type: "root" }
  | { type: "superadmin" }
  | { type: "tenant"; subDomain: string };

export function isValidSubdomain(sub: string): boolean {
  if (!sub) return false;
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(sub);
}

export function resolveHostContext(host: string | null): HostContext {
  const hostname = (host ?? "").split(":")[0].trim().toLowerCase();
  const rootDomain = (process.env.NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN || "").toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return { type: "root" };
  }

  // rootDomain aniq bo'lganda, hostname unga aynan teng bo'lsa har doim root.
  // Bu quyidagi parts.length>=3 fallback root domenning o'zini (masalan
  // "dental.ilmtech.uz" — 3 ta label) noto'g'ri tenant deb aniqlashining oldini oladi.
  if (rootDomain && hostname === rootDomain) {
    return { type: "root" };
  }

  let sub: string | null = null;

  if (hostname.endsWith(".localhost")) {
    sub = hostname.slice(0, -".localhost".length);
  } else if (rootDomain) {
    if (hostname.endsWith(`.${rootDomain}`)) {
      const candidate = hostname.slice(0, hostname.length - rootDomain.length - 1);
      if (candidate && !candidate.includes(".")) sub = candidate;
    }
  } else {
    // rootDomain umuman noma'lum — bitta ehtimoliy usul: >=3 labelli hostname'ning
    // birinchi qismini subdomain deb hisoblash. NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN
    // to'g'ri sozlanganda bu branch'ga umuman kirilmaydi.
    const parts = hostname.split(".");
    if (parts.length >= 3) sub = parts[0];
  }

  if (!sub || !isValidSubdomain(sub)) return { type: "root" };
  if (sub === SUPER_ADMIN_SUBDOMAIN) return { type: "superadmin" };
  if (RESERVED_SUBDOMAINS.has(sub)) return { type: "root" };

  return { type: "tenant", subDomain: sub };
}

export function getSubdomainFromHost(host: string | null): string | null {
  const ctx = resolveHostContext(host);
  return ctx.type === "tenant" ? ctx.subDomain : null;
}
