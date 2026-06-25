// File: src/features/users/user.service.ts

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "@/src/types/user.types";

function getTenantClient() {
  /**
   * MUHIM:
   * tenantHttp() tenantni URL'dan oladi.
   *
   * Example:
   * frontend: http://clinic1.localhost:3000/dashboard
   * backend:  https://clinic1.dental.api.ilmtech.uz
   */
  return tenantHttp();
}

export async function getMe(): Promise<UserProfile> {
  try {
    const http = getTenantClient();

    const response = await http.get<UserProfile>(ENDPOINTS.users.me);

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[User Service] Failed to get user profile:",
        getApiErrorMessage(error)
      );
    }

    throw new Error(getApiErrorMessage(error, "Failed to load profile"));
  }
}

export async function updateMe(
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  try {
    const http = getTenantClient();

    const response = await http.put<UserProfile>(
      ENDPOINTS.users.me,
      payload
    );

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[User Service] Failed to update profile:",
        getApiErrorMessage(error)
      );
    }

    throw new Error(getApiErrorMessage(error, "Failed to update profile"));
  }
}

export async function changePassword(
  payload: ChangePasswordPayload
): Promise<void> {
  try {
    const http = getTenantClient();

    await http.put(ENDPOINTS.users.changePassword, payload);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[User Service] Failed to change password:",
        getApiErrorMessage(error)
      );
    }

    throw new Error(getApiErrorMessage(error, "Failed to change password"));
  }
}