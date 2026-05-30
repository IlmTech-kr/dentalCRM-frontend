import { tenantHttp } from "@/src/lib/api/http";

import type {
  DoctorSchedule,
  DoctorSchedulePayload,
  UpdateDoctorSchedulePayload,
  WeeklyDoctorSchedulePayload,
} from "@/src/types/doctor-schedule.types";

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

function normalizeTime(time?: string | null): string {
  if (!time) return "";

  const value = String(time).trim();

  /**
   * Backend sometimes returns:
   * "09:00:00"
   *
   * HTML time input needs:
   * "09:00"
   */
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return value;
}

function normalizeTimeForApi(time: string): string {
  /**
   * Your API examples use:
   * "09:00"
   *
   * So we send "09:00", not "09:00:00".
   */
  return normalizeTime(time);
}

export function normalizeDoctorSchedule(schedule: any): DoctorSchedule {
  return {
    ...schedule,
    id: schedule.id || schedule._id,
    _id: schedule._id || schedule.id,
    startTime: normalizeTime(schedule.startTime),
    endTime: normalizeTime(schedule.endTime),
  };
}

/**
 * Backend can return schedule like this:
 *
 * {
 *   _id: "...",
 *   tenantId: "...",
 *   doctorId: "...",
 *   days: [
 *     {
 *       dayOfWeek: "MONDAY",
 *       startTime: "09:00:00",
 *       endTime: "18:00:00",
 *       active: true
 *     }
 *   ]
 * }
 *
 * UI needs row-like data:
 *
 * {
 *   _id: "...",
 *   doctorId: "...",
 *   dayOfWeek: "MONDAY",
 *   startTime: "09:00",
 *   endTime: "18:00",
 *   active: true
 * }
 */
export function normalizeDoctorScheduleRows(schedule: any): DoctorSchedule[] {
  if (Array.isArray(schedule.days) && schedule.days.length > 0) {
    return schedule.days.map((day: any) => ({
      ...schedule,
      id: schedule.id || schedule._id,
      _id: schedule._id || schedule.id,
      dayOfWeek: day.dayOfWeek,
      startTime: normalizeTime(day.startTime),
      endTime: normalizeTime(day.endTime),
      active: day.active,
    }));
  }

  return [normalizeDoctorSchedule(schedule)];
}

function extractSchedules(result: any): any[] {
  if (Array.isArray(result)) return result;

  return (
    result.data ||
    result.schedules ||
    result.users ||
    result.content ||
    result.items ||
    result.results ||
    []
  );
}

/**
 * GET /api/dental/doctor-schedules?page=0&limit=20
 */
export async function getDoctorSchedules(
  page = 0,
  limit = 20
): Promise<DoctorSchedule[]> {
  const http = getHttp();

  const response = await http.get(
    `/api/dental/doctor-schedules?page=${page}&limit=${limit}`
  );

  const schedules = extractSchedules(response.data);

  return schedules.flatMap(normalizeDoctorScheduleRows);
}

/**
 * GET /api/dental/doctor-schedules/:id
 */
export async function getDoctorScheduleById(
  scheduleId: string
): Promise<DoctorSchedule> {
  const http = getHttp();

  const response = await http.get(
    `/api/dental/doctor-schedules/${scheduleId}`
  );

  return normalizeDoctorSchedule(response.data);
}

/**
 * POST /api/dental/doctor-schedules
 *
 * Daily schedule create qiladi.
 * Masalan faqat MONDAY uchun.
 */
export async function createDoctorSchedule(
  payload: DoctorSchedulePayload
): Promise<DoctorSchedule> {
  const http = getHttp();

  const response = await http.post("/api/dental/doctor-schedules", {
    doctorId: payload.doctorId,
    dayOfWeek: payload.dayOfWeek,
    startTime: normalizeTimeForApi(payload.startTime),
    endTime: normalizeTimeForApi(payload.endTime),
    active: payload.active,
  });

  return normalizeDoctorSchedule(response.data);
}

/**
 * POST /api/dental/doctor-schedules/weekly
 *
 * Hamma kunlar uchun bir xil schedule create qiladi.
 *
 * Payload:
 * {
 *   doctorId: "...",
 *   startTime: "09:00",
 *   endTime: "13:00",
 *   active: true
 * }
 */
export async function createWeeklyDoctorSchedule(
  payload: WeeklyDoctorSchedulePayload
): Promise<DoctorSchedule> {
  const http = getHttp();

  const response = await http.post("/api/dental/doctor-schedules/weekly", {
    doctorId: payload.doctorId,
    startTime: normalizeTimeForApi(payload.startTime),
    endTime: normalizeTimeForApi(payload.endTime),
    active: payload.active,
  });

  return normalizeDoctorSchedule(response.data);
}

/**
 * PUT /api/dental/doctor-schedules/:id
 *
 * Bitta schedule kunini update qiladi.
 *
 * Payload:
 * {
 *   dayOfWeek: "FRIDAY",
 *   startTime: "09:00",
 *   endTime: "18:00",
 *   active: false
 * }
 */
export async function updateDoctorSchedule(
  scheduleId: string,
  payload: UpdateDoctorSchedulePayload
): Promise<DoctorSchedule> {
  const http = getHttp();

  const response = await http.put(
    `/api/dental/doctor-schedules/${scheduleId}`,
    {
      dayOfWeek: payload.dayOfWeek,
      startTime: normalizeTimeForApi(payload.startTime),
      endTime: normalizeTimeForApi(payload.endTime),
      active: payload.active,
    }
  );

  return normalizeDoctorSchedule(response.data);
}

/**
 * DELETE /api/dental/doctor-schedules/:id
 *
 * Agar backendda DELETE API bo'lmasa,
 * hook va page'da delete ishlatmang.
 */
export async function deleteDoctorSchedule(
  scheduleId: string
): Promise<void> {
  const http = getHttp();

  await http.delete(`/api/dental/doctor-schedules/${scheduleId}`);
}