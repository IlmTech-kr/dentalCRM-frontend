// http
import axios, { AxiosInstance, AxiosError } from "axios";
import { ENDPOINTS } from "./endpoints";

const MAIN_API_URL =
  process.env.NEXT_PUBLIC_MAIN_API_URL || "http://localhost:9000";

export const mainHttp = axios.create({
  baseURL: MAIN_API_URL,
  withCredentials: true,
});

export function getTenantApiUrl(subDomain: string): string {
  // Support both localhost and production domains
  const isProduction = typeof window !== "undefined" && 
    !window.location.hostname.includes("localhost");
  
  if (isProduction) {
    // For production: clinic1.dentalcrm.uz
    const domain = window.location.hostname.split(".").slice(1).join(".");
    return `https://${subDomain}.${domain}`;
  }
  
  // For localhost development: clinic1.localhost:9000
  return `http://${subDomain}.localhost:9000`;
}

/**
 * Extract tenant ID from JWT token payload
 * JWT format: header.payload.signature
 * Payload is base64 encoded JSON
 */
function getTenantIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    // Return tenant ID from token (could be "tenantId", "tenant_id", or "sub")
    return payload.tenantId || payload.tenant_id || payload.sub || null;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export function tenantHttp(subDomain: string): AxiosInstance {
  const apiUrl = getTenantApiUrl(subDomain);

  const instance = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor: Add auth token and tenant ID
  instance.interceptors.request.use(
    (config) => {
      if (typeof window === "undefined") {
        return config;
      }

      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        // Add the access token
        config.headers.Authorization = `Bearer ${accessToken}`;

        // Extract tenant ID from token to ensure it matches
        const tokenTenantId = getTenantIdFromToken(accessToken);
        
        // Use tenant ID from token if available, otherwise use subdomain
        const tenantIdToSend = tokenTenantId || subDomain;
        config.headers["X-Tenant-ID"] = tenantIdToSend;

        console.debug(
          `[API] Request: ${config.method?.toUpperCase()} ${config.url}`,
          {
            tenantId: tenantIdToSend,
            hasToken: !!accessToken,
          }
        );
      } else {
        // No token - still add the X-Tenant-ID
        config.headers["X-Tenant-ID"] = subDomain;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: Handle 401 and refresh token
  instance.interceptors.response.use(
    (response) => {
      console.debug(
        `[API] Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
      );
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;
      const errorData = error.response?.data as any;

      console.error(
        `[API] Error: ${error.response?.status} - ${errorData?.code}`,
        errorData?.message
      );

      // Handle 403 Tenant Mismatch
      if (
        error.response?.status === 403 &&
        errorData?.code === "AUTH_TENANT_MISMATCH"
      ) {
        console.error(
          "Tenant mismatch detected. Token tenant ID does not match request context."
        );
        
        if (typeof window !== "undefined") {
          // Clear stored credentials and redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("subDomain");
          window.location.href = "/login";
        }
        
        return Promise.reject(error);
      }

      // If error is 401 (Unauthorized) and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh the token
          const refreshResponse = await axios.post(
            `${apiUrl}${ENDPOINTS.auth.refresh}`,
            {},
            {
              withCredentials: true,
              headers: {
                "X-Tenant-ID": subDomain,
              },
            }
          );

          const newAccessToken = refreshResponse.data?.accessToken;

          if (newAccessToken && typeof window !== "undefined") {
            // Store the new token
            localStorage.setItem("accessToken", newAccessToken);
            
            // Extract tenant ID from new token
            const newTokenTenantId = getTenantIdFromToken(newAccessToken);
            const tenantIdToSend = newTokenTenantId || subDomain;

            // Update the original request with new token and tenant ID
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            originalRequest.headers["X-Tenant-ID"] = tenantIdToSend;

            console.debug("[API] Token refreshed and request retried");

            // Retry the original request
            return instance(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);

          // Clear stored data and redirect to login
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("subDomain");
            window.location.href = "/login";
          }

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}