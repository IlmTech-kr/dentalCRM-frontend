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
import {
  saveAuthData,
  clearAuthStorage,
} from "@/src/lib/auth/storage";

import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterClinicDto,
  ResetPasswordDto,
} from "@/src/types/auth.types";

/**
 * Register clinic
 *
 * Root API orqali: https://dental.api.ilmtech.uz/api/auth/register
 */
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
 * Login
 *
 * POST https://clinic11.dental.api.ilmtech.uz/api/auth/login
 *
 * Authorization yo'q, X-Tenant-ID yo'q.
 * Subdomain URL'dan olinadi.
 */
export async function login(data: LoginDto) {
  try {
    // Eski auth datani tozalaymiz (savedLogin saqlanib qoladi)
    clearAuthStorage();

    const http = publicTenantHttp();

    const response = await http.post(ENDPOINTS.auth.login, {
      email: data.email.trim(),
      password: data.password,
    });

    // Shared helper orqali bir chaqiruvda hammasini saqlaymiz
    saveAuthData(response.data);

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Auth] login failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Login failed"));
  }
}

/**
 * Forgot password
 *
 * POST https://clinic11.dental.api.ilmtech.uz/api/auth/forgot-password
 */
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

/**
 * Reset password
 */
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
 * Logout
 *
 * Backend logout endpoint bo'lsa, avval backendga request yuboradi.
 * Keyin localStorage tozalanadi va /login ga redirect.
 */
export async function logout() {
  try {
    const logoutEndpoint = (ENDPOINTS.auth as any).logout;

    if (logoutEndpoint) {
      const http = tenantHttp();

      await http.post(logoutEndpoint);
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