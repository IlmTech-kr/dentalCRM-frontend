/**
 * File: src/lib/auth/storage.ts
 *
 * accessToken localStorage'da SAQLANMAYDI.
 * Token backend tomonidan HttpOnly cookie sifatida boshqariladi.
 *
 * subDomain / tenantId localStorage'da SAQLANMAYDI —
 * tenant har doim faqat URL (subdomain) dan olinadi.
 * Bu AUTH_TENANT_MISMATCH xatosiga olib kelgani uchun olib tashlandi.
 *
 * clearAuthStorage() eski accessToken/subDomain/tenantId keylarini
 * ham tozalaydi (migration — avvalgi versiyalardan qolgan qiymatlar).
 */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

const KEYS = {
  // faqat clearAuthStorage da o'chiriladi (migration)
  accessToken: "accessToken",
  accessTokenAlt: "access_token",

  // faqat clearAuthStorage da o'chiriladi (migration)
  subDomain: "subDomain",
  subDomainAlt: "subdomain",

  // faqat clearAuthStorage da o'chiriladi (migration)
  tenantId: "tenantId",
  tenantIdAlt: "tenant_id",

  authUser: "authUser",
  authClinic: "authClinic",

  savedLogin: "savedLogin",
} as const;

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

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
 * accessToken, subDomain, tenantId SAQLANMAYDI:
 * - accessToken backend cookie orqali boshqaradi.
 * - subDomain va tenantId har doim URL dan (getCurrentSubdomain) olinadi,
 *   localStorage'dan emas — aks holda eski/boshqa tenant qiymati
 *   qolib ketib, so'rovlar noto'g'ri tenant uchun ketishi mumkin.
 */
export function saveAuthData(data: Record<string, any>): void {
  const user = data?.user || data?.profile || data?.data?.user || null;
  const clinic = data?.clinic || data?.data?.clinic || null;

  saveUser(user);
  saveClinic(clinic);
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

export function clearAuthStorage(): void {
  if (!isBrowser()) return;

  // eski versiyadan qolgan qiymatlarni ham tozalash (migration)
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