import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "@/src/types/user.types";

function getSubdomain(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("subDomain") || "";
}

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
    throw new Error("Failed to update profile");
  }
}

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
    throw new Error("Failed to change password");
  }
}