// File: src/lib/api/http.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

const MAIN_API_URL =
  process.env.NEXT_PUBLIC_MAIN_API_URL || "http://localhost:9000";

const TENANT_API_PROTOCOL =
  process.env.NEXT_PUBLIC_TENANT_API_PROTOCOL || "http";

const TENANT_API_PORT = process.env.NEXT_PUBLIC_TENANT_API_PORT || "9000";

export type ApiErrorObject = {
  status?: number;
  code?: string;
  message?: string;
};

/**
 * JWT token ichidan tenantId olish
 */
export function getTenantIdFromToken(token: string): string | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) return null;

    const decodedPayload = JSON.parse(atob(payload));

    return (
      decodedPayload.tenantId ||
      decodedPayload.tenant_id ||
      decodedPayload.clinicId ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Access token olish
 */
function getAccessToken(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    ""
  );
}

/**
 * Subdomain olish
 */
function getStoredSubDomain(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("subDomain") ||
    localStorage.getItem("subdomain") ||
    ""
  );
}

/**
 * Tenant ID olish
 */
function getStoredTenantId(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("tenantId") ||
    localStorage.getItem("tenant_id") ||
    ""
  );
}

/**
 * Auth storage tozalash
 */
export function clearAuthStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("tenantId");
  localStorage.removeItem("tenant_id");
  localStorage.removeItem("subDomain");
  localStorage.removeItem("subdomain");
}

/**
 * Tenant base url yasash
 *
 * Example:
 * clinic1 => http://clinic1.localhost:9000
 */
function buildTenantBaseUrl(subDomain: string): string {
  return `${TENANT_API_PROTOCOL}://${subDomain}.localhost:${TENANT_API_PORT}`;
}

/**
 * API errorni oddiy objectga aylantirish
 *
 * MUHIM:
 * Bu yerda new Error() throw qilmaymiz.
 * Chunki Next.js dev mode overlay chiqarishi mumkin.
 */
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

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return {
      message: String((error as { message?: string }).message || ""),
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
    };
  }

  return {
    message: "Something went wrong",
  };
}

/**
 * Toast yoki UI uchun error message olish
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  const normalized = normalizeApiError(error);

  return normalized.message || fallback;
}

/**
 * Common interceptors
 */
function attachInterceptors(instance: AxiosInstance, subDomain?: string) {
  /**
   * Request interceptor
   */
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = getAccessToken();

      const storedSubDomain = subDomain || getStoredSubDomain();
      const storedTenantId = getStoredTenantId();

      const tokenTenantId = accessToken
        ? getTenantIdFromToken(accessToken)
        : "";

      const tenantIdToSend = storedTenantId || tokenTenantId || storedSubDomain;

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      if (tenantIdToSend) {
        config.headers["X-Tenant-ID"] = tenantIdToSend;
      }

      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response interceptor
   */
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(
          `[API] ${response.status} ${response.config.method?.toUpperCase()} ${
            response.config.url
          }`
        );
      }

      return response;
    },

    async (error: AxiosError<any>) => {
      const originalRequest = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined;

      const errorData = error.response?.data as any;

      /**
       * MUHIM:
       * console.error ishlatma.
       * Next.js dev overlay console.error sabab chiqishi mumkin.
       */
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

      /**
       * Tenant mismatch bo‘lsa logout
       */
      if (
        error.response?.status === 403 &&
        errorData?.code === "AUTH_TENANT_MISMATCH"
      ) {
        console.warn(
          "Tenant mismatch detected. Token tenant ID does not match request context."
        );

        clearAuthStorage();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(normalizeApiError(error));
      }

      /**
       * 401 bo‘lsa refresh token qilib ko‘ramiz
       */
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const storedSubDomain = subDomain || getStoredSubDomain();
          const storedTenantId = getStoredTenantId();

          const refreshResponse = await axios.post(
            `${MAIN_API_URL}${ENDPOINTS.auth.refresh}`,
            {},
            {
              withCredentials: true,
              headers: {
                "Content-Type": "application/json",
                "X-Tenant-ID": storedTenantId || storedSubDomain,
              },
            }
          );

          const newAccessToken =
            refreshResponse.data?.accessToken ||
            refreshResponse.data?.access_token;

          if (!newAccessToken) {
            return Promise.reject({
              status: 401,
              code: "NO_ACCESS_TOKEN",
              message: "No access token returned from refresh endpoint",
            });
          }

          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", newAccessToken);
            localStorage.setItem("access_token", newAccessToken);
          }

          const newTokenTenantId = getTenantIdFromToken(newAccessToken);

          const tenantIdToSend =
            storedTenantId || newTokenTenantId || storedSubDomain;

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          if (tenantIdToSend) {
            originalRequest.headers["X-Tenant-ID"] = tenantIdToSend;
          }

          if (process.env.NODE_ENV === "development") {
            console.debug("[API] Token refreshed. Retrying request...");
          }

          return instance(originalRequest);
        } catch (refreshError) {
          console.warn("Token refresh failed:", refreshError);

          clearAuthStorage();

          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }

          return Promise.reject(normalizeApiError(refreshError));
        }
      }

      /**
       * Expected API errors:
       * 400, 404, 409, validation errors va boshqalar
       * new Error emas, plain object qaytaramiz.
       */
      return Promise.reject(normalizeApiError(error));
    }
  );
}

/**
 * Main API
 *
 * Example:
 * register clinic, super admin, main auth
 */
export const mainHttp = axios.create({
  baseURL: MAIN_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

attachInterceptors(mainHttp);

/**
 * Tenant API
 *
 * Usage:
 * const http = tenantHttp("clinic1");
 * await http.get("/api/v1/admin/users");
 */
export function tenantHttp(subDomain?: string): AxiosInstance {
  const finalSubDomain = subDomain || getStoredSubDomain();

  if (!finalSubDomain) {
    throw {
      code: "NO_TENANT_SUBDOMAIN",
      message: "No tenant subdomain found",
    };
  }

  const instance = axios.create({
    baseURL: buildTenantBaseUrl(finalSubDomain),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  attachInterceptors(instance, finalSubDomain);

  return instance;
}