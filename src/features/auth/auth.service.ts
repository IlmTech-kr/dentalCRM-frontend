/**
 * File: src/features/auth/auth.service.ts
 */

import { ENDPOINTS } from "@/src/lib/api/endpoints";
import {
  mainHttp,
  publicTenantHttp,
  tenantHttp,
  getApiErrorMessage,
} from "@/src/lib/api/http";
import { saveAuthData, clearAuthStorage } from "@/src/lib/auth/storage";

import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterClinicDto,
  ResetPasswordDto,
} from "@/src/types/auth.types";

export async function registerClinic(data: RegisterClinicDto) {
  try {
    const response = await mainHttp.post(ENDPOINTS.auth.register, data);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Auth] registerClinic failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Clinic registration failed"));
  }
}

/**
 * Backend Set-Cookie orqali access_token va refresh_token yuboradi.
 * accessToken localStorage'da saqlanmaydi.
 */
export async function login(data: LoginDto) {
  try {
    clearAuthStorage();

    const http = publicTenantHttp();

    const response = await http.post(ENDPOINTS.auth.login, {
      email: data.email.trim(),
      password: data.password,
    });

    saveAuthData(response.data);

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Auth] login failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Login failed"));
  }
}

export async function forgotPassword(data: ForgotPasswordDto) {
  try {
    const http = publicTenantHttp();
    const response = await http.post(ENDPOINTS.auth.forgotPassword, {
      email: data.email.trim(),
    });
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Auth] forgotPassword failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to send reset link"));
  }
}

export async function resetPassword(data: ResetPasswordDto) {
  try {
    const http = publicTenantHttp();
    const response = await http.post(ENDPOINTS.auth.resetPassword, data);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Auth] resetPassword failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to reset password"));
  }
}

/**
 * Backend logout endpointi cookie'ni o'chiradi.
 * Keyin localStorage tozalanadi va /login ga redirect.
 */
export async function logout() {
  try {
    const logoutEndpoint = (ENDPOINTS.auth as any).logout;
    if (logoutEndpoint) {
      await tenantHttp().post(logoutEndpoint);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Auth] logout request failed:", getApiErrorMessage(error));
    }
  } finally {
    clearAuthStorage();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}