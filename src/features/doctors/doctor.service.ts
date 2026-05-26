// File: src/features/doctors/doctor.service.ts

import { tenantHttp } from "@/src/lib/api/http";
import type {
  Doctor,
  DoctorListResponse,
  InviteDoctorDto,
  UpdateDoctorDto,
} from "@/src/types/doctor.types";

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
  };
}

/**
 * GET /api/v1/admin/users?page=0&limit=10
 */
export async function getDoctors(): Promise<Doctor[]> {
  const http = getHttp();

  const response = await http.get<DoctorListResponse | Doctor[]>(
    "/api/v1/admin/users?page=0&limit=10"
  );

  const result = response.data;

  const users = Array.isArray(result)
    ? result
    : result.data || result.users || result.content || [];

  return users
    .filter((user: any) => user.roles?.includes("DOCTOR"))
    .map(normalizeDoctor);
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
 *
 * Sends invite email.
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
  payload: UpdateDoctorDto
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