// File: src/features/auth/auth.service.ts
import axios from "axios";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { mainHttp, tenantHttp } from "@/src/lib/api/http";
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterClinicDto,
  ResetPasswordDto,
} from "@/src/types/auth.types";

function saveAuthData(data: any, subDomain?: string) {
  if (typeof window === "undefined") return;

  const accessToken = data?.accessToken || data?.access_token;
  const tenantId = data?.tenantId || data?.tenant_id;

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("access_token", accessToken);
  }

  if (tenantId) {
    localStorage.setItem("tenantId", tenantId);
    localStorage.setItem("tenant_id", tenantId);
  }

  if (subDomain) {
    localStorage.setItem("subDomain", subDomain);
    localStorage.setItem("subdomain", subDomain);
  }
}

function clearAuthData() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("tenantId");
  localStorage.removeItem("tenant_id");
  localStorage.removeItem("subDomain");
  localStorage.removeItem("subdomain");
}

/**
 * Register clinic
 */
export async function registerClinic(data: RegisterClinicDto) {
  const response = await mainHttp.post(ENDPOINTS.auth.register, data);
  return response.data;
}

/**
 * Login clinic user
 */
export async function login(data: LoginDto) {
  clearAuthData();

  const subDomain = data.subDomain.trim();

  const response = await axios.post(
    `http://${subDomain}.localhost:9000/api/auth/login`,
    {
      email: data.email.trim(),
      password: data.password,
    },
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  saveAuthData(response.data, subDomain);

  return response.data;
}

/**
 * Forgot password
 */
export async function forgotPassword(data: ForgotPasswordDto) {
  const subDomain = data.subDomain?.trim();

  if (subDomain) {
    const http = tenantHttp(subDomain);

    const response = await http.post(ENDPOINTS.auth.forgotPassword, {
      email: data.email.trim(),
    });

    return response.data;
  }

  const response = await mainHttp.post(ENDPOINTS.auth.forgotPassword, data);
  return response.data;
}

/**
 * Reset password
 */
export async function resetPassword(data: ResetPasswordDto) {
  const subDomain =
    typeof window !== "undefined"
      ? localStorage.getItem("subDomain") || localStorage.getItem("subdomain")
      : "";

  if (subDomain) {
    const http = tenantHttp(subDomain);

    const response = await http.post(ENDPOINTS.auth.resetPassword, data);

    return response.data;
  }

  const response = await mainHttp.post(ENDPOINTS.auth.resetPassword, data);
  return response.data;
}

/**
 * Logout
 */
export function logout() {
  clearAuthData();

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}