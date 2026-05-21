// File: src/features/auth/auth.service.ts
import axios, { AxiosError } from "axios";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { mainHttp, tenantHttp } from "@/src/lib/api/http";
import {
  ForgotPasswordDto,
  InviteUserDto,
  LoginDto,
  RegisterClinicDto,
  ResetPasswordDto,
} from "@/src/types/auth.types";

/**
 * Register a new clinic
 */
export async function registerClinic(data: RegisterClinicDto) {
  try {
    const res = await mainHttp.post(ENDPOINTS.auth.register, data);
    return res.data;
  } catch (error) {
    console.error("Failed to register clinic:", error);
    throw error;
  }
}

/**
 * Login user with subdomain
 */
export async function login(data: LoginDto) {
  try {
    localStorage.clear();

    const res = await axios.post(
      `http://${data.subDomain}.localhost:9000${ENDPOINTS.auth.login}`,
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

    // Store credentials
    localStorage.setItem("subDomain", data.subDomain);

    if (res.data?.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }

    return res.data;
  } catch (error) {
    console.error("Failed to login:", error);
    throw error;
  }
}

/**
 * Refresh the access token
 */
export async function refreshToken(subDomain: string) {
  try {
    const api = tenantHttp(subDomain);
    const res = await api.post(ENDPOINTS.auth.refresh);

    if (res.data?.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }

    return res.data;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
}

/**
 * Send invite to user
 */
export async function sendInvite(data: InviteUserDto) {
  try {
    const api = tenantHttp(data.subDomain);

    const res = await api.post(ENDPOINTS.auth.invites, {
      email: data.email,
      role: data.role,
    });

    return res.data;
  } catch (error) {
    console.error("Failed to send invite:", error);
    throw error;
  }
}

/**
 * Request password reset link
 * ✅ FIXED: Uses dynamic subdomain from ForgotPasswordDto
 * ✅ FIXED: Uses tenantHttp for proper auth headers
 */
export async function forgotPassword(data: ForgotPasswordDto) {
  try {
    if (!data.email || !data.email.trim()) {
      throw new Error("Email is required");
    }

    if (!data.subDomain) {
      throw new Error("Subdomain is required");
    }

    const api = tenantHttp(data.subDomain);

    const res = await api.post(ENDPOINTS.auth.forgotPassword, {
      email: data.email.trim(),
    });

    return res.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || "Failed to send reset link";
      throw new Error(message);
    }
    throw error;
  }
}

/**
 * Reset password with token
 * ✅ FIXED: Uses mainHttp for public endpoint
 */
export async function resetPassword(data: ResetPasswordDto) {
  try {
    if (!data.token || !data.token.trim()) {
      throw new Error("Reset token is required");
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const res = await mainHttp.post(ENDPOINTS.auth.resetPassword, {
      token: data.token.trim(),
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });

    return res.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || "Failed to reset password";
      throw new Error(message);
    }
    throw error;
  }
}

/**
 * Logout user
 */
export function logout() {
  localStorage.clear();
  window.location.href = "/login";
}