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
    throw new Error(getApiErrorMessage(error, "Clinic registration failed"));
  }
}

export async function login(data: LoginDto) {
  try {
    clearAuthStorage();

    const http = publicTenantHttp();

    const response = await http.post(ENDPOINTS.auth.login, {
      email: data.email.trim(),
      password: data.password,
    });

    // ===== DEBUG START =====
    console.group("[AUTH DEBUG] Login response");
    console.log("Status:", response.status);
    console.log("Response data keys:", Object.keys(response.data || {}));
    console.log("Has user:", Boolean(response.data?.user));
    console.log("Has accessToken in body:", Boolean(response.data?.accessToken));
    console.log("Response headers:", response.headers);

    // Set-Cookie header ni tekshirish
    const setCookie = response.headers["set-cookie"];
    console.log("Set-Cookie header:", setCookie);

    // document.cookie — HttpOnly bo'lmagan cookie lar ko'rinadi
    console.log("document.cookie after login:", document.cookie);
    console.groupEnd();
    // ===== DEBUG END =====

    saveAuthData(response.data);

    return response.data;
  } catch (error) {
    console.error("[AUTH DEBUG] Login failed:", error);
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
    throw new Error(getApiErrorMessage(error, "Failed to send reset link"));
  }
}

export async function resetPassword(data: ResetPasswordDto) {
  try {
    const http = publicTenantHttp();
    const response = await http.post(ENDPOINTS.auth.resetPassword, data);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to reset password"));
  }
}

export async function logout() {
  try {
    const logoutEndpoint = (ENDPOINTS.auth as any).logout;
    if (logoutEndpoint) {
      await tenantHttp().post(logoutEndpoint);
    }
  } catch (error) {
    console.warn("[Auth] logout request failed:", getApiErrorMessage(error));
  } finally {
    clearAuthStorage();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}