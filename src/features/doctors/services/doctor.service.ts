// File: src/features/doctors/doctor.service.ts

import { tenantHttp } from "@/src/lib/api/http";
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

function getSubdomain(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("subDomain") ||
    localStorage.getItem("subdomain") ||
    ""
  );
}

function getHttp() {
  const subDomain = getSubdomain();

  if (!subDomain) {
    throw {
      code: "NO_TENANT_SUBDOMAIN",
      message: "No tenant subdomain found",
    };
  }

  return tenantHttp(subDomain);
}

function normalizeDoctor(user: any): Doctor {
  return {
    ...user,
    id: user.id || user._id,
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

  return [];
}

function isStaffUser(user: Doctor): boolean {
  return user.roles?.some((role) => STAFF_ROLES.includes(role as StaffRole));
}

/**
 * GET /api/v1/admin/users?page=0&limit=100
 */
export async function getDoctors(): Promise<Doctor[]> {
  const http = getHttp();

  const response = await http.get<DoctorListResponse | Doctor[]>(
    "/api/v1/admin/users?page=0&limit=100",
  );

  const users = extractUsers(response.data);

  return users.map(normalizeDoctor).filter(isStaffUser);
}

/**
 * GET /api/v1/admin/users/:id
 */
export async function getDoctorById(doctorId: string): Promise<Doctor> {
  const http = getHttp();

  const response = await http.get(`/api/v1/admin/users/${doctorId}`);

  return normalizeDoctor(response.data);
}

/**
 * POST /api/auth/invites
 */
export async function inviteDoctor(payload: InviteDoctorDto): Promise<void> {
  const http = getHttp();

  await http.post("/api/auth/invites", payload);
}

/**
 * PUT /api/v1/admin/users/:id
 */
export async function updateDoctor(
  doctorId: string,
  payload: UpdateDoctorDto,
): Promise<Doctor> {
  const http = getHttp();

  const response = await http.put(`/api/v1/admin/users/${doctorId}`, payload);

  return normalizeDoctor(response.data);
}

/**
 * DELETE /api/v1/admin/users/:id
 */
export async function deleteDoctor(doctorId: string): Promise<void> {
  const http = getHttp();

  await http.delete(`/api/v1/admin/users/${doctorId}`);
}