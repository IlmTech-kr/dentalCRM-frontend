// File: src/features/user/user.service.ts
import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "@/src/types/user.types";
import { AxiosError } from "axios";

/**
 * Get subdomain from localStorage
 */
function getSubdomain(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("subDomain") || "";
}

/**
 * Get current user profile
 */
export async function getMe(): Promise<UserProfile> {
  try {
    const subDomain = getSubdomain();

    if (!subDomain) {
      throw new Error("No tenant subdomain found");
    }

    const http = tenantHttp(subDomain);
    const response = await http.get<UserProfile>(ENDPOINTS.users.me);

    return response.data;
  } catch (error) {
    console.error("Failed to get user profile:", error);
    throw new Error("Failed to load profile");
  }
}

/**
 * Update current user profile
 */
export async function updateMe(
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  try {
    const subDomain = getSubdomain();

    if (!subDomain) {
      throw new Error("No tenant subdomain found");
    }

    const http = tenantHttp(subDomain);
    const response = await http.put<UserProfile>(
      ENDPOINTS.users.me,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Failed to update profile:", error);
    
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || "Failed to update profile";
      throw new Error(message);
    }
    
    throw error;
  }
}

/**
 * Change password for current user
 */
export async function changePassword(
  payload: ChangePasswordPayload
): Promise<void> {
  try {
    const subDomain = getSubdomain();

    if (!subDomain) {
      throw new Error("No tenant subdomain found");
    }

    const http = tenantHttp(subDomain);
    await http.put(ENDPOINTS.users.changePassword, payload);
  } catch (error) {
    console.error("Failed to change password:", error);
    
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || "Failed to change password";
      throw new Error(message);
    }
    
    throw error;
  }
}