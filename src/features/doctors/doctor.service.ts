import { AxiosError } from "axios";
import { tenantHttp } from "@/src/lib/api/http";
import type {
  Doctor,
  InviteDoctorDto,
  UpdateDoctorDto,
} from "@/src/types/doctor.types";

function getTenantId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("tenantId") || "";
}

function getSubdomain(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("subDomain") || "";
}

function getHttp() {
  const subDomain = getSubdomain();

  if (!subDomain) {
    throw new Error("No tenant subdomain found");
  }

  return tenantHttp(subDomain);
}

export async function getDoctors(): Promise<Doctor[]> {
  const http = getHttp();

  const response = await http.get("/api/v1/admin/users?page=0&limit=10", {
    headers: {
      "X-Tenant-ID": getTenantId(),
    },
  });

  const users = response.data?.data || response.data?.users || response.data || [];

  return users
    .filter((user: any) => user.roles?.includes("DOCTOR"))
    .map((user: any) => ({
      ...user,
      id: user.id || user._id,
    }));
}

export async function getDoctorById(doctorId: string): Promise<Doctor> {
  const http = getHttp();

  const response = await http.get(`/api/v1/admin/users/${doctorId}`, {
    headers: {
      "X-Tenant-ID": getTenantId(),
    },
  });

  return {
    ...response.data,
    id: response.data.id || response.data._id,
  };
}

export async function inviteDoctor(payload: InviteDoctorDto): Promise<void> {
  const http = getHttp();

  try {
    await http.post("/api/auth/invites", payload, {
      headers: {
        "X-Tenant-ID": getTenantId(),
      },
    });
  } catch (error) {
    const axiosError = error as AxiosError<any>;

    const status = axiosError.response?.status;
    const code = axiosError.response?.data?.code;
    const message =
      axiosError.response?.data?.message ||
      "Doctor invite yuborishda xatolik bo‘ldi";

    // Expected API error: user already exists
    if (status === 409 || code === "AUTH_INVITE_EMAIL_EXISTS") {
      throw {
        status,
        code,
        message,
      };
    }

    throw {
      status,
      code,
      message,
    };
  }
}

export async function updateDoctor(
  doctorId: string,
  payload: UpdateDoctorDto
): Promise<Doctor> {
  const http = getHttp();

  const response = await http.put(`/api/v1/admin/users/${doctorId}`, payload, {
    headers: {
      "X-Tenant-ID": getTenantId(),
    },
  });

  return {
    ...response.data,
    id: response.data.id || response.data._id,
  };
}

export async function deleteDoctor(doctorId: string): Promise<void> {
  const http = getHttp();

  await http.delete(`/api/v1/admin/users/${doctorId}`, {
    headers: {
      "X-Tenant-ID": getTenantId(),
    },
  });
}