import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  DoctorSchedule,
  DoctorSchedulePayload,
  DoctorSchedulesResponse,
  UpdateDoctorSchedulePayload,
} from "@/src/types/doctor-schedule.types";

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

export async function getDoctorSchedules(
  page = 0,
  limit = 20
): Promise<DoctorSchedulesResponse | DoctorSchedule[]> {
  const http = getHttp();

  const response = await http.get(ENDPOINTS.doctorSchedules.list, {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}

export async function getDoctorScheduleById(
  id: string
): Promise<DoctorSchedule> {
  const http = getHttp();

  const response = await http.get(ENDPOINTS.doctorSchedules.byId(id));

  return response.data;
}

export async function createDoctorSchedule(
  payload: DoctorSchedulePayload
): Promise<DoctorSchedule> {
  const http = getHttp();

  console.log("CREATE DOCTOR SCHEDULE BODY:", payload);

  const response = await http.post(ENDPOINTS.doctorSchedules.create, payload);

  return response.data;
}

export async function updateDoctorSchedule(
  id: string,
  payload: UpdateDoctorSchedulePayload
): Promise<DoctorSchedule> {
  const http = getHttp();

  const response = await http.put(
    ENDPOINTS.doctorSchedules.byId(id),
    payload
  );

  return response.data;
}