import { AxiosError } from "axios";
import type {
  Doctor,
  InviteDoctorDto,
  UpdateDoctorDto,
} from "@/src/types/doctor.types";
import { getCurrentSubdomain, getTenantId } from "@/src/lib/utils/tenant";
import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";



export async function getDoctors(): Promise<Doctor[]> {
    try {
        const subDomain = getCurrentSubdomain();
    
        if (!subDomain) {
          throw new Error("No tenant subdomain found");
        }
    
        const http = tenantHttp(subDomain);
        const response = await http.get(ENDPOINTS.doctors.list);
    
        const users = response.data?.data || response.data?.users || response.data || [];

        return users
            .filter((user: any) => user.roles?.includes("DOCTOR"))
            .map((user: any) => ({
            ...user,
            id: user.id || user._id,
            }));
    
      } catch (error) {
        console.error("Failed to load users:", error);
        throw new Error("Failed to load users");
      }
}

export async function getDoctorById(doctorId: string): Promise<Doctor> {

    try {
        const subDomain = getCurrentSubdomain();
    
        if (!subDomain) {
          throw new Error("No tenant subdomain found");
        }
    
        const http = tenantHttp(subDomain);

        const response = await http.get(ENDPOINTS.doctors.byId(doctorId));
    
        const users = response.data?.data || response.data?.users || response.data || [];

        return users
            .filter((user: any) => user.roles?.includes("DOCTOR"))
            .map((user: any) => ({
            ...user,
            id: user.id || user._id,
            }));
    
      } catch (error) {
        console.error("Failed to load users:", error);
        throw new Error("Failed to load users");
      }

}

export async function inviteDoctor(payload: InviteDoctorDto): Promise<void> {
  const http = tenantHttp();

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
  const http = tenantHttp();

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
  const http = tenantHttp();

  await http.delete(`/api/v1/admin/users/${doctorId}`, {
    headers: {
      "X-Tenant-ID": getTenantId(),
    },
  });
}