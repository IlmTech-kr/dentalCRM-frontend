/**
 * File: src/lib/api/http.ts
 *
 * Token cookie orqali ketadi — Authorization header qo'shilmaydi.
 * withCredentials: true — cookie cross-origin requestlarda avtomatik yuboriladi.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { getCurrentSubdomain } from "@/src/lib/utils/tenant";
import { clearAuthStorage } from "@/src/lib/auth/storage";

const MAIN_API_URL =
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

// ---------------------------------------------------------------------------
// URL builders
// ---------------------------------------------------------------------------

export function buildTenantBaseUrl(subDomain: string): string {
  const cleanSubDomain = subDomain.trim().toLowerCase();

  if (!cleanSubDomain) {
    throw {
      code: "NO_TENANT_SUBDOMAIN",
      message: "No tenant subdomain found",
    };
  }

  const port = TENANT_API_PORT ? `:${TENANT_API_PORT}` : "";

  if (TENANT_API_ROOT_DOMAIN === "localhost") {
    return `${TENANT_API_PROTOCOL}://${cleanSubDomain}.localhost${port}`;
  }

  return `${TENANT_API_PROTOCOL}://${cleanSubDomain}.${TENANT_API_ROOT_DOMAIN}${port}`;
}

function getTenantSubDomainForBaseUrl(): string {
  const urlSubdomain = getCurrentSubdomain();

  if (urlSubdomain) {
    return urlSubdomain.trim().toLowerCase();
  }

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

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

export function normalizeApiError(error: unknown): ApiErrorObject {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;

    return {
      status: error.response?.status,
      code: data?.code || data?.errorCode || data?.error,
      message:
        data?.message ||
        data?.error ||
        error.message ||
        "Request failed",
    };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return {
      message: String((error as { message?: string }).message || ""),
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return { message: "Something went wrong" };
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  return normalizeApiError(error).message || fallback;
}

function redirectToLogin(): void {
  if (!isBrowser()) return;

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------

function attachTenantInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Token cookie orqali ketadi — Authorization header kerak emas
      delete config.headers.Authorization;

      // X-Tenant-ID hech qachon yuborilmaydi
      delete config.headers["X-Tenant-ID"];
      delete config.headers["x-tenant-id"];
      delete config.headers["X-Tenant-Id"];

      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }

      if (!config.headers["Accept-Language"]) {
        config.headers["Accept-Language"] = "uz";
      }

      if (process.env.NODE_ENV === "development") {
        console.debug("[API DEBUG]", {
          frontendHost: isBrowser() ? window.location.host : null,
          apiBaseURL: config.baseURL,
          requestURL: config.url,
        });
      }

      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(
          `[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
        );
      }

      return response;
    },

    async (error: AxiosError<any>) => {
      const errorData = error.response?.data as any;

      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[API] ${error.response?.status || "NO_STATUS"} - ${
            errorData?.code || errorData?.error || "UNKNOWN_ERROR"
          }: ${
            errorData?.message ||
            errorData?.error ||
            error.message ||
            "Request failed"
          }`
        );
      }

      if (error.response?.status === 401) {
        clearAuthStorage();
        redirectToLogin();
        return Promise.reject(normalizeApiError(error));
      }

      if (
        error.response?.status === 403 &&
        errorData?.code === "AUTH_TENANT_MISMATCH"
      ) {
        clearAuthStorage();
        redirectToLogin();
        return Promise.reject(normalizeApiError(error));
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

  const instance = axios.create({
    baseURL: buildTenantBaseUrl(subDomain),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "uz",
    },
  });

  attachTenantInterceptors(instance);

  tenantHttpCache.set(subDomain, instance);

  return instance;
}

export function clearTenantHttpCache(): void {
  tenantHttpCache.clear();
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