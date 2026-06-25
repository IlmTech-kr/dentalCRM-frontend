/**
 * File: src/lib/auth/storage.ts
 *
 * Auth storage uchun bitta shared helper.
 *
 * MUHIM:
 * Bu fayl barcha joydan import qilinadi:
 * - src/lib/api/http.ts
 * - src/store/auth.store.ts
 * - src/features/auth/auth.service.ts
 *
 * Ikki xil `clearAuthStorage()` muammosi shu fayl orqali hal qilinadi.
 */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ---------------------------------------------------------------------------
// Keys — bitta joyda, typo xatosi bo'lmasin
// ---------------------------------------------------------------------------

const KEYS = {
  accessToken: "accessToken",
  accessTokenAlt: "access_token",

  subDomain: "subDomain",
  subDomainAlt: "subdomain",

  tenantId: "tenantId",
  tenantIdAlt: "tenant_id",

  authUser: "authUser",
  authClinic: "authClinic",

  /**
   * savedLogin o'chirilmaydi — "Remember me" uchun email saqlanadi.
   * Faqat user o'zi "Remember me" ni o'chirganida yoki explicit
   * `clearSavedLogin()` chaqirilganida o'chiriladi.
   */
  savedLogin: "savedLogin",
} as const;

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getStoredAccessToken(): string | null {
  if (!isBrowser()) return null;

  return (
    localStorage.getItem(KEYS.accessToken) ||
    localStorage.getItem(KEYS.accessTokenAlt) ||
    null
  );
}

export function getStoredSubDomain(): string | null {
  if (!isBrowser()) return null;

  return (
    localStorage.getItem(KEYS.subDomain) ||
    localStorage.getItem(KEYS.subDomainAlt) ||
    null
  );
}

export function getStoredTenantId(): string | null {
  if (!isBrowser()) return null;

  return (
    localStorage.getItem(KEYS.tenantId) ||
    localStorage.getItem(KEYS.tenantIdAlt) ||
    null
  );
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

export function saveAccessToken(token: string | null): void {
  if (!isBrowser()) return;

  if (token) {
    localStorage.setItem(KEYS.accessToken, token);
    // Alt key ni tozalaymiz — ikki joyda bir xil token turmasin
    localStorage.removeItem(KEYS.accessTokenAlt);
  } else {
    localStorage.removeItem(KEYS.accessToken);
    localStorage.removeItem(KEYS.accessTokenAlt);
  }
}

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
 * Login response dan barcha auth datani saqlaydi.
 *
 * Response example:
 * {
 *   accessToken: "...",
 *   tenantId: "6a0a369117af7a26622a42e5",
 *   clinic: {
 *     id: "...",
 *     subDomain: "clinic11"
 *   },
 *   user: { ... }
 * }
 */
export function saveAuthData(data: Record<string, any>): void {
  const accessToken = data?.accessToken || data?.access_token || null;

  const subDomain =
    data?.clinic?.subDomain ||
    data?.clinic?.subdomain ||
    data?.subDomain ||
    data?.subdomain ||
    null;

  const tenantId =
    data?.tenantId ||
    data?.tenant_id ||
    data?.clinic?.id ||
    data?.clinic?._id ||
    null;

  const user = data?.user || data?.profile || data?.data?.user || null;

  const clinic = data?.clinic || data?.data?.clinic || null;

  saveAccessToken(accessToken);
  saveSubDomain(subDomain);
  saveTenantId(tenantId);
  saveUser(user);
  saveClinic(clinic);
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

/**
 * Barcha auth datani tozalaydi.
 *
 * `savedLogin` INTENTIONALLY o'chirilmaydi —
 * "Remember Me" funksiyasi uchun email saqlanib qoladi.
 * Uni o'chirish uchun alohida `clearSavedLogin()` ishlatiladi.
 *
 * MUHIM: Bu funksiya bitta shared source of truth.
 * http.ts, auth.store.ts, auth.service.ts — barchasi
 * o'z ichida clear qilmasin, faqat shu funksiyani chaqirsin.
 */
export function clearAuthStorage(): void {
  if (!isBrowser()) return;

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