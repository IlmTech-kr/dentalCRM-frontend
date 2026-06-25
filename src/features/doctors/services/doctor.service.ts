/**
 * File: src/features/doctors/services/doctor.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { Role } from "@/src/lib/enums/enums.types";

import type {
  Doctor,
  DoctorListResponse,
  InviteDoctorDto,
  StaffRole,
  UpdateDoctorDto,
} from "@/src/types/doctor.types";

const STAFF_ROLES: StaffRole[] = [
  Role.DOCTOR,
  Role.RECEPTIONIST,
  Role.ASSISTANT,
];

function normalizeDoctor(user: any): Doctor {
  return {
    ...user,
    id: user.id || user._id,
    _id: user._id || user.id,
    phoneNumber: user.phoneNumber || user.phone || "",
    roles: Array.isArray(user.roles) ? user.roles : [],
  };
}

function extractUsers(result: DoctorListResponse | Doctor[] | any): any[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.users)) return result.users;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.results)) return result.results;
  if (Array.isArray(result?.data?.content)) return result.data.content;
  return [];
}

function isStaffUser(user: Doctor): boolean {
  return user.roles?.some((role) => STAFF_ROLES.includes(role as StaffRole));
}

/**
 * GET /api/v1/admin/users?page=0&limit=100
 *
 * Faqat DOCTOR, RECEPTIONIST, ASSISTANT roleli userlar qaytariladi.
 */
export async function getDoctors(): Promise<Doctor[]> {
  try {
    const response = await tenantHttp().get<DoctorListResponse | Doctor[]>(
      "/api/v1/admin/users?page=0&limit=100"
    );

    const users = extractUsers(response.data);

    return users.map(normalizeDoctor).filter(isStaffUser);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Service] getDoctors failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load doctors"));
  }
}

/**
 * GET /api/v1/admin/users/:id
 */
export async function getDoctorById(doctorId: string): Promise<Doctor> {
  try {
    const response = await tenantHttp().get(`/api/v1/admin/users/${doctorId}`);

    return normalizeDoctor(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Service] getDoctorById failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load doctor"));
  }
}

/**
 * POST /api/auth/invites
 */
export async function inviteDoctor(payload: InviteDoctorDto): Promise<void> {
  try {
    await tenantHttp().post("/api/auth/invites", payload);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Service] inviteDoctor failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to invite user"));
  }
}

/**
 * PUT /api/v1/admin/users/:id
 */
export async function updateDoctor(
  doctorId: string,
  payload: UpdateDoctorDto
): Promise<Doctor> {
  try {
    const response = await tenantHttp().put(
      `/api/v1/admin/users/${doctorId}`,
      payload
    );

    return normalizeDoctor(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Service] updateDoctor failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to update doctor"));
  }
}

/**
 * DELETE /api/v1/admin/users/:id
 */
export async function deleteDoctor(doctorId: string): Promise<void> {
  try {
    await tenantHttp().delete(`/api/v1/admin/users/${doctorId}`);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Service] deleteDoctor failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to delete doctor"));
  }
}