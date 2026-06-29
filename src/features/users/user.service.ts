// File: src/features/users/user.service.ts

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "@/src/types/user.types";

export async function getMe(): Promise<UserProfile> {
  try {
    const http = tenantHttp();

    // ===== DEBUG START =====
    console.group("[AUTH DEBUG] getMe() called");
    console.log("document.cookie:", document.cookie);
    console.log("Request baseURL:", (http.defaults as any).baseURL);
    console.log("withCredentials:", (http.defaults as any).withCredentials);
    console.groupEnd();
    // ===== DEBUG END =====

    const response = await http.get<UserProfile>(ENDPOINTS.users.me);

    // ===== DEBUG START =====
    console.group("[AUTH DEBUG] getMe() success");
    console.log("Status:", response.status);
    console.log("User id:", (response.data as any)?.id);
    console.groupEnd();
    // ===== DEBUG END =====

    return response.data;
  } catch (error: any) {
    // ===== DEBUG START =====
    console.group("[AUTH DEBUG] getMe() FAILED");
    console.log("Status:", error?.response?.status);
    console.log("Error code:", error?.response?.data?.code);
    console.log("document.cookie at fail:", document.cookie);
    console.groupEnd();
    // ===== DEBUG END =====

    throw new Error(getApiErrorMessage(error, "Failed to load profile"));
  }
}

export async function updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
  try {
    const http = tenantHttp();
    const response = await http.put<UserProfile>(ENDPOINTS.users.me, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update profile"));
  }
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  try {
    const http = tenantHttp();
    await http.put(ENDPOINTS.users.changePassword, payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to change password"));
  }
}