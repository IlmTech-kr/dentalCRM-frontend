/**
 * File: src/features/doctors/services/doctor-schedule.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";

import type {
  DoctorSchedule,
  DoctorSchedulePayload,
  UpdateDoctorSchedulePayload,
  WeeklyDoctorSchedulePayload,
} from "@/src/types/doctor-schedule.types";

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

function normalizeTime(time?: string | null): string {
  if (!time) return "";

  const value = String(time).trim();

  // "HH:MM:SS" → "HH:MM"
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return value;
}

// ---------------------------------------------------------------------------
// Response normalizers
// ---------------------------------------------------------------------------

export function normalizeDoctorSchedule(schedule: any): DoctorSchedule {
  return {
    ...schedule,
    id: schedule.id || schedule._id,
    _id: schedule._id || schedule.id,
    startTime: normalizeTime(schedule.startTime),
    endTime: normalizeTime(schedule.endTime),
  };
}

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
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.schedules)) return result.schedules;
  if (Array.isArray(result?.users)) return result.users;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.results)) return result.results;
  if (Array.isArray(result?.data?.content)) return result.data.content;
  return [];
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * GET /api/dental/doctor-schedules?page=0&limit=20
 */
export async function getDoctorSchedules(
  page = 0,
  limit = 20
): Promise<DoctorSchedule[]> {
  try {
    const response = await tenantHttp().get(
      `/api/dental/doctor-schedules?page=${page}&limit=${limit}`
    );

    const schedules = extractSchedules(response.data);

    return schedules.flatMap(normalizeDoctorScheduleRows);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Schedule Service] getDoctorSchedules failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load schedules"));
  }
}

/**
 * GET /api/dental/doctor-schedules/:id
 */
export async function getDoctorScheduleById(
  scheduleId: string
): Promise<DoctorSchedule> {
  try {
    const response = await tenantHttp().get(
      `/api/dental/doctor-schedules/${scheduleId}`
    );

    return normalizeDoctorSchedule(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Schedule Service] getDoctorScheduleById failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load schedule"));
  }
}

/**
 * POST /api/dental/doctor-schedules
 */
export async function createDoctorSchedule(
  payload: DoctorSchedulePayload
): Promise<DoctorSchedule> {
  try {
    const response = await tenantHttp().post("/api/dental/doctor-schedules", {
      doctorId: payload.doctorId,
      dayOfWeek: payload.dayOfWeek,
      startTime: normalizeTime(payload.startTime),
      endTime: normalizeTime(payload.endTime),
      active: payload.active,
    });

    return normalizeDoctorSchedule(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Schedule Service] createDoctorSchedule failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to create schedule"));
  }
}

/**
 * POST /api/dental/doctor-schedules/weekly
 */
export async function createWeeklyDoctorSchedule(
  payload: WeeklyDoctorSchedulePayload
): Promise<DoctorSchedule> {
  try {
    const response = await tenantHttp().post(
      "/api/dental/doctor-schedules/weekly",
      {
        doctorId: payload.doctorId,
        startTime: normalizeTime(payload.startTime),
        endTime: normalizeTime(payload.endTime),
        active: payload.active,
      }
    );

    return normalizeDoctorSchedule(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Schedule Service] createWeeklyDoctorSchedule failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to create weekly schedule"));
  }
}

/**
 * PUT /api/dental/doctor-schedules/:id
 */
export async function updateDoctorSchedule(
  scheduleId: string,
  payload: UpdateDoctorSchedulePayload
): Promise<DoctorSchedule> {
  try {
    const response = await tenantHttp().put(
      `/api/dental/doctor-schedules/${scheduleId}`,
      {
        doctorId: payload.doctorId,
        dayOfWeek: payload.dayOfWeek,
        startTime: normalizeTime(payload.startTime),
        endTime: normalizeTime(payload.endTime),
        active: payload.active,
      }
    );

    return normalizeDoctorSchedule(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Schedule Service] updateDoctorSchedule failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to update schedule"));
  }
}

/**
 * DELETE /api/dental/doctor-schedules/:id
 */
export async function deleteDoctorSchedule(scheduleId: string): Promise<void> {
  try {
    await tenantHttp().delete(`/api/dental/doctor-schedules/${scheduleId}`);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Doctor Schedule Service] deleteDoctorSchedule failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to delete schedule"));
  }
}