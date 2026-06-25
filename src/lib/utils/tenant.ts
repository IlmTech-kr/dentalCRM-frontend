/**
 * File: src/lib/utils/tenant.ts
 */

const FRONTEND_ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN || "";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "dashboard",
]);

function cleanHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

function isValidSubdomain(subdomain: string): boolean {
  /**
   * Valid:   clinic1, clinic-1, clinic11
   * Invalid: clinic_1, clinic.abc, -clinic, clinic-
   */
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain);
}

function normalizeSubdomain(value: string | null): string | null {
  if (!value) return null;

  const subdomain = value.trim().toLowerCase();

  if (!subdomain) return null;
  if (RESERVED_SUBDOMAINS.has(subdomain)) return null;
  if (!isValidSubdomain(subdomain)) return null;

  return subdomain;
}

export function getSubdomainFromHost(host: string | null): string | null {
  if (!host) return null;

  const hostname = cleanHost(host);

  // Plain localhost — tenant yo'q
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  ) {
    return null;
  }

  // Local: clinic11.localhost
  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.replace(".localhost", "");
    return normalizeSubdomain(subdomain);
  }

  // Production: clinic11.dentalcrm.uz
  if (FRONTEND_ROOT_DOMAIN && hostname.endsWith(`.${FRONTEND_ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${FRONTEND_ROOT_DOMAIN}`, "");

    // Nested subdomain (a.b.dentalcrm.uz) — tenant emas
    if (subdomain.includes(".")) return null;

    return normalizeSubdomain(subdomain);
  }

  // Fallback: clinic11.some-domain.uz
  // Productionda NEXT_PUBLIC_FRONTEND_ROOT_DOMAIN berilgan bo'lsin
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return normalizeSubdomain(parts[0]);
  }

  return null;
}

export function getCurrentSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  return getSubdomainFromHost(window.location.host);
}

export function requireCurrentSubdomain(): string {
  const subdomain = getCurrentSubdomain();

  if (!subdomain) {
    throw {
      code: "NO_TENANT_SUBDOMAIN",
      message:
        "No tenant subdomain found in URL. Open clinic11.localhost:3000",
    };
  }

  return subdomain;
}

export function isTenantUrl(): boolean {
  return Boolean(getCurrentSubdomain());
}