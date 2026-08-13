/**
 * Cookie-based auth.
 * 401 bo'lganda avval /api/auth/refresh ga uriniladi,
 * muvaffaqiyatli bo'lsa asl request qayta yuboriladi.
 * Refresh ham 401 bersa — /login ga redirect.
 *
 * mainHttp — subdomainsiz, to'g'ridan-to'g'ri MAIN_API_URL
 * (masalan https://dental.api.ilmtech.uz) ga so'rov yuboradi.
 * SUPERADMIN paneli (admin.dental.ilmtech.uz) shu instance orqali ishlaydi —
 * hech qanday tenant/subdomain header qo'shilmaydi.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { getCurrentSubdomain } from "@/src/lib/tenant.client";
import { clearAuthStorage } from "@/src/lib/auth/storage";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

export const MAIN_API_URL =
  process.env.NEXT_PUBLIC_MAIN_API_URL || "https://dental.api.ilmtech.uz";

const TENANT_API_PROTOCOL =
  process.env.NEXT_PUBLIC_TENANT_API_PROTOCOL || "https";

const TENANT_API_ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_TENANT_API_ROOT_DOMAIN || "dental.api.ilmtech.uz";

const ENV_TENANT_API_PORT = process.env.NEXT_PUBLIC_TENANT_API_PORT;

const TENANT_API_PORT =
  ENV_TENANT_API_PORT !== undefined
    ? ENV_TENANT_API_PORT.trim()
    : TENANT_API_ROOT_DOMAIN === "localhost"
      ? "9000"
      : "";

export type ApiErrorObject = {
  status?: number;
  code?: string;
  message?: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function buildTenantBaseUrl(subDomain: string): string {
  const cleanSubDomain = subDomain.trim().toLowerCase();

  if (!cleanSubDomain) {
    throw { code: "NO_TENANT_SUBDOMAIN", message: "No tenant subdomain found" };
  }

  const port = TENANT_API_PORT ? `:${TENANT_API_PORT}` : "";

  if (TENANT_API_ROOT_DOMAIN === "localhost") {
    return `${TENANT_API_PROTOCOL}://${cleanSubDomain}.localhost${port}`;
  }

  return `${TENANT_API_PROTOCOL}://${cleanSubDomain}.${TENANT_API_ROOT_DOMAIN}${port}`;
}

function getTenantSubDomainForBaseUrl(): string {
  const urlSubdomain = getCurrentSubdomain();
  if (urlSubdomain) return urlSubdomain.trim().toLowerCase();

  throw {
    code: "NO_TENANT_SUBDOMAIN",
    message: "No tenant subdomain found in URL. Open clinic11.localhost:3000",
  };
}

function getUrlSubDomain(): string {
  const subDomain = getCurrentSubdomain();
  if (!subDomain) {
    throw {
      code: "NO_TENANT_SUBDOMAIN",
      message: "No tenant subdomain found in URL. Open clinic11.localhost:3000",
    };
  }
  return subDomain.trim().toLowerCase();
}

export function normalizeApiError(error: unknown): ApiErrorObject {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    return {
      status: error.response?.status,
      code: data?.code || data?.errorCode || data?.error,
      message: data?.message || data?.error || error.message || "Request failed",
    };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return { message: String((error as { message?: string }).message || "") };
  }

  if (typeof error === "string") return { message: error };

  return { message: "Something went wrong" };
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  return normalizeApiError(error).message || fallback;
}

function redirectToLogin(reason: string): void {
  if (!isBrowser()) return;
  if (window.location.pathname !== "/login") {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Auth] redirecting to /login — reason: ${reason}`);
    }
    clearAuthStorage();
    window.location.href = "/login";
  }
}

// ---------------------------------------------------------------------------
// Token refresh — bitta vaqtda faqat bitta refresh so'rovi ketsin
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function subscribeToRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefreshSubscribers(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

async function tryRefreshToken(baseURL: string): Promise<boolean> {
  try {
    await axios.post(
      `${baseURL}${ENDPOINTS.auth.refresh}`,
      {},
      { withCredentials: true }
    );
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const kind =
        status !== undefined
          ? `HTTP ${status}`
          : axios.isAxiosError(error) && !error.response
            ? "no response (network/CORS — cookie may not have been sent)"
            : "unknown error";
      console.warn(`[Auth] refresh request to ${baseURL} failed — ${kind}`);
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------

function attachTenantInterceptors(instance: AxiosInstance, baseURL: string): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      delete config.headers.Authorization;
      delete config.headers["X-Tenant-ID"];
      delete config.headers["x-tenant-id"];
      delete config.headers["X-Tenant-Id"];

      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }

      if (!config.headers["Accept-Language"]) {
        config.headers["Accept-Language"] = "uz";
      }

      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,

    async (error: AxiosError<any>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _tenantRetry?: boolean;
      };

      // 401 — access token muddati tugagan, refresh urinish
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[Auth] 401 on ${originalRequest.method?.toUpperCase()} ${originalRequest.url} — attempting refresh`
          );
        }

        // Refresh endpointining o'zi 401 bersa — cheksiz loop bo'lmasin
        if (originalRequest.url?.includes(ENDPOINTS.auth.refresh)) {
          redirectToLogin(`refresh endpoint itself returned 401 (${originalRequest.url})`);
          return Promise.reject(normalizeApiError(error));
        }

        if (isRefreshing) {
          // Boshqa refresh ketayotgan bo'lsa — u tugaguncha kutamiz
          return new Promise((resolve, reject) => {
            subscribeToRefresh((success) => {
              if (success) {
                resolve(instance(originalRequest));
              } else {
                reject(normalizeApiError(error));
              }
            });
          });
        }

        isRefreshing = true;

        const refreshed = await tryRefreshToken(baseURL);

        isRefreshing = false;
        notifyRefreshSubscribers(refreshed);

        if (refreshed) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[Auth] refresh succeeded, retrying ${originalRequest.url}`);
          }
          // Yangi cookie o'rnatildi — asl requestni qayta yuboramiz
          return instance(originalRequest);
        } else {
          // Refresh ham muvaffaqiyatsiz — logout
          redirectToLogin(`refresh failed after 401 on ${originalRequest.url}`);
          return Promise.reject(normalizeApiError(error));
        }
      }

      // 403 — ruxsat yo'q (masalan rol payroll/revenue ko'rish huquqiga ega
      // emas). AVVAL bu yerda AUTH_TENANT_MISMATCH kodi bo'yicha avtomatik
      // /login'ga chiqarilardi, lekin production'da backend shu XUDDI SHU
      // kodni oddiy rol-ruxsat tekshiruvlarida ham qaytarayotgani aniqlandi
      // (masalan /statistics/revenue, /subscriptions/current, /admin/users) —
      // bu haqiqiy tenant mos kelmasligi bo'lmasa ham, foydalanuvchini har
      // safar shu widget'lardan biri yuklanganda sessiyadan chiqarib
      // yuborardi. 403 endi boshqa xatolar kabi oddiy tarzda reject
      // qilinadi — har bir hook o'zining mavjud xato-ko'rsatish (toast/
      // console.warn) orqali "ruxsat yo'q" holatini ko'rsatadi, butun
      // sessiya emas. Haqiqiy sessiya yaroqsizligi 401 orqali (yuqorida)
      // to'g'ri ushlanadi.

      // AUTH_TENANT_MISMATCH — client-side navigatsiyada (masalan login'dan
      // keyin darhol Patients'ga o'tishda) ba'zan qisqa muddatli/tranzient
      // bo'ladi: birinchi so'rov 403 qaytaradi, xuddi shu so'rov darhol
      // qayta yuborilsa 200 bilan muvaffaqiyatli bo'ladi (backendning token/
      // tenant kontekstini sinxronlashtirish kechikishi). Shu sabab — faqat
      // shu aniq kod uchun — bir marta darhol qayta urinib ko'ramiz, sikl
      // bo'lmasin uchun _tenantRetry bilan.
      const errorCode = (error.response?.data as { code?: string } | undefined)?.code;

      if (
        error.response?.status === 403 &&
        errorCode === "AUTH_TENANT_MISMATCH" &&
        !originalRequest._tenantRetry
      ) {
        originalRequest._tenantRetry = true;

        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[Auth] 403 AUTH_TENANT_MISMATCH on ${originalRequest.url} — retrying once`
          );
        }

        try {
          return await instance(originalRequest);
        } catch (retryError) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[Auth] retry after AUTH_TENANT_MISMATCH also failed for ${originalRequest.url}`
            );
          }
          return Promise.reject(normalizeApiError(retryError));
        }
      }

      return Promise.reject(normalizeApiError(error));
    }
  );
}

// ---------------------------------------------------------------------------
// Singleton cache — tenantHttp
// ---------------------------------------------------------------------------

const tenantHttpCache = new Map<string, AxiosInstance>();

export function tenantHttp(subDomainOverride?: string): AxiosInstance {
  const subDomain = (subDomainOverride || getTenantSubDomainForBaseUrl())
    .trim()
    .toLowerCase();

  const cached = tenantHttpCache.get(subDomain);
  if (cached) return cached;

  const baseURL = buildTenantBaseUrl(subDomain);

  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "uz",
    },
  });

  attachTenantInterceptors(instance, baseURL);
  tenantHttpCache.set(subDomain, instance);

  return instance;
}

export function clearTenantHttpCache(): void {
  tenantHttpCache.clear();
}

let fetchRefreshPromise: Promise<boolean> | null = null;

/** Fetch variant for streaming endpoints; preserves the same cookie/refresh policy as tenantHttp. */
export async function tenantFetch(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true
): Promise<Response> {
  const baseURL = buildTenantBaseUrl(getTenantSubDomainForBaseUrl());
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", isBrowser() ? document.documentElement.lang || "uz" : "uz");
  }
  headers.delete("Authorization");
  headers.delete("X-Tenant-ID");

  const response = await fetch(`${baseURL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status !== 401 || !retryAfterRefresh) return response;

  fetchRefreshPromise ??= tryRefreshToken(baseURL).finally(() => {
    fetchRefreshPromise = null;
  });
  const refreshed = await fetchRefreshPromise;
  if (!refreshed) {
    redirectToLogin(`stream refresh failed after 401 on ${path}`);
    return response;
  }
  return tenantFetch(path, init, false);
}

// ---------------------------------------------------------------------------
// Public instances
// ---------------------------------------------------------------------------

export const mainHttp = axios.create({
  baseURL: MAIN_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "uz",
  },
});

/**
 * mainHttp ham xuddi tenantHttp kabi 401-refresh-retry oqimidan foydalanadi.
 * SUPERADMIN doim shu instance orqali ishlaydi — subdomain header'lari
 * qo'shilmaydi, so'rov to'g'ridan-to'g'ri MAIN_API_URL (masalan
 * https://dental.api.ilmtech.uz) ga ketadi, hostdan qat'i nazar
 * (admin.dental.ilmtech.uz'da ochilgan bo'lsa ham).
 */
attachTenantInterceptors(mainHttp, MAIN_API_URL);

export const publicMainHttp = axios.create({
  baseURL: MAIN_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "uz",
  },
});

export function publicTenantHttp(subDomainOverride?: string): AxiosInstance {
  const subDomain = (subDomainOverride || getUrlSubDomain())
    .trim()
    .toLowerCase();

  return axios.create({
    baseURL: buildTenantBaseUrl(subDomain),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "uz",
    },
  });
}
