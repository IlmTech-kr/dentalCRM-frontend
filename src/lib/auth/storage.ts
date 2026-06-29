/**
 * File: src/lib/auth/storage.ts
 *
 * accessToken localStorage'da SAQLANMAYDI.
 * Token backend tomonidan HttpOnly cookie sifatida boshqariladi.
 * clearAuthStorage() eski accessToken keylarini ham tozalaydi (migration).
 */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

const KEYS = {
  // faqat clearAuthStorage da o'chiriladi (migration)
  accessToken: "accessToken",
  accessTokenAlt: "access_token",

  subDomain: "subDomain",
  subDomainAlt: "subdomain",

  tenantId: "tenantId",
  tenantIdAlt: "tenant_id",

  authUser: "authUser",
  authClinic: "authClinic",

  savedLogin: "savedLogin",
} as const;

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getStoredSubDomain(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.subDomain) || localStorage.getItem(KEYS.subDomainAlt) || null;
}

export function getStoredTenantId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.tenantId) || localStorage.getItem(KEYS.tenantIdAlt) || null;
}

export function getStoredUser<T = unknown>(): T | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(KEYS.authUser);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(KEYS.authUser);
    return null;
  }
}

export function getStoredClinic<T = unknown>(): T | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(KEYS.authClinic);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(KEYS.authClinic);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Setters
// ---------------------------------------------------------------------------

export function saveSubDomain(subDomain: string | null): void {
  if (!isBrowser()) return;
  if (subDomain) {
    localStorage.setItem(KEYS.subDomain, subDomain.trim().toLowerCase());
    localStorage.removeItem(KEYS.subDomainAlt);
  } else {
    localStorage.removeItem(KEYS.subDomain);
    localStorage.removeItem(KEYS.subDomainAlt);
  }
}

export function saveTenantId(tenantId: string | null): void {
  if (!isBrowser()) return;
  if (tenantId) {
    localStorage.setItem(KEYS.tenantId, tenantId);
    localStorage.removeItem(KEYS.tenantIdAlt);
  } else {
    localStorage.removeItem(KEYS.tenantId);
    localStorage.removeItem(KEYS.tenantIdAlt);
  }
}

export function saveUser(user: unknown): void {
  if (!isBrowser()) return;
  if (user) {
    localStorage.setItem(KEYS.authUser, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.authUser);
  }
}

export function saveClinic(clinic: unknown): void {
  if (!isBrowser()) return;
  if (clinic) {
    localStorage.setItem(KEYS.authClinic, JSON.stringify(clinic));
  } else {
    localStorage.removeItem(KEYS.authClinic);
  }
}

// ---------------------------------------------------------------------------
// Auth data — login response dan bir chaqiruvda saqlash
// ---------------------------------------------------------------------------

/**
 * accessToken SAQLANMAYDI — backend cookie orqali boshqaradi.
 */
export function saveAuthData(data: Record<string, any>): void {
  const subDomain =
    data?.clinic?.subDomain || data?.clinic?.subdomain ||
    data?.subDomain || data?.subdomain || null;

  const tenantId =
    data?.tenantId || data?.tenant_id ||
    data?.clinic?.id || data?.clinic?._id || null;

  const user = data?.user || data?.profile || data?.data?.user || null;
  const clinic = data?.clinic || data?.data?.clinic || null;

  saveSubDomain(subDomain);
  saveTenantId(tenantId);
  saveUser(user);
  saveClinic(clinic);
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

export function clearAuthStorage(): void {
  if (!isBrowser()) return;

  // eski versiyadan qolgan tokenlarni ham tozalash (migration)
  localStorage.removeItem(KEYS.accessToken);
  localStorage.removeItem(KEYS.accessTokenAlt);

  localStorage.removeItem(KEYS.subDomain);
  localStorage.removeItem(KEYS.subDomainAlt);

  localStorage.removeItem(KEYS.tenantId);
  localStorage.removeItem(KEYS.tenantIdAlt);

  localStorage.removeItem(KEYS.authUser);
  localStorage.removeItem(KEYS.authClinic);
}

export function clearSavedLogin(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.savedLogin);
}