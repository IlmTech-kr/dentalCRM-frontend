/**
 * File: src/features/appointments/appointment.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";

import type {
  Appointment,
  AppointmentListResponse,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "@/src/types/appointment.types";

// ---------------------------------------------------------------------------
// Time / Date helpers
// ---------------------------------------------------------------------------

function normalizeAppointmentTime(time?: string | null): string {
  if (!time) return "";

  const value = String(time).trim();

  // "11:00:00" → "11:00"
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return value;
}

function normalizeTimeForApi(time?: string | null): string {
  if (!time) return "";

  const value = String(time).trim();

  // "11:00" → "11:00:00"
  if (/^\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }

  return value;
}

function normalizeDateForApi(date?: string | Date | null): string {
  if (!date) return "";

  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const value = String(date).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return value;
}

function calculateDurationMinutes(
  startTime?: string | null,
  endTime?: string | null
): number | undefined {
  const start = normalizeAppointmentTime(startTime);
  const end = normalizeAppointmentTime(endTime);

  if (!start || !end) return undefined;

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return undefined;
  }

  const duration = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  return duration > 0 ? duration : undefined;
}

// ---------------------------------------------------------------------------
// Response normalizer
// ---------------------------------------------------------------------------

function normalizeAppointment(appointment: any): Appointment {
  const startTime = normalizeAppointmentTime(appointment.startTime);
  const endTime = normalizeAppointmentTime(appointment.endTime);
  const calculatedDuration = calculateDurationMinutes(startTime, endTime);

  return {
    ...appointment,
    id: appointment.id || appointment._id,
    _id: appointment._id || appointment.id,
    appointmentDate: normalizeDateForApi(appointment.appointmentDate),
    startTime,
    endTime,
    slotDurationMinutes:
      appointment.slotDurationMinutes || calculatedDuration || undefined,
  };
}

function extractAppointments(
  result: AppointmentListResponse | Appointment[]
): Appointment[] {
  if (Array.isArray(result)) return result;

  return (
    result.data ||
    result.appointments ||
    result.content ||
    result.items ||
    result.results ||
    []
  );
}

// ---------------------------------------------------------------------------
// Service functions
//
// tenantHttp() argumentsiz chaqiriladi — subdomain URL dan olinadi.
// getHttp() / getSubdomain() olib tashlandi:
// localStorage fallback AUTH_TENANT_MISMATCH xatosiga olib kelardi.
// ---------------------------------------------------------------------------

/**
 * GET /api/dental/appointments?page=0&limit=10
 */
export async function getAppointments(
  page = 0,
  limit = 10
): Promise<Appointment[]> {
  try {
    const response = await tenantHttp().get<AppointmentListResponse | Appointment[]>(
      `/api/dental/appointments?page=${page}&limit=${limit}`
    );

    return extractAppointments(response.data).map(normalizeAppointment);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Appointment Service] getAppointments failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load appointments"));
  }
}

/**
 * GET /api/dental/appointments/:id
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<Appointment> {
  try {
    const response = await tenantHttp().get<Appointment>(
      `/api/dental/appointments/${appointmentId}`
    );

    return normalizeAppointment(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Appointment Service] getAppointmentById failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load appointment"));
  }
}

/**
 * GET /api/dental/appointments/by-date?date=2026-06-06
 */
export async function getAppointmentsByDate(
  date: string | Date
): Promise<Appointment[]> {
  try {
    const normalizedDate = normalizeDateForApi(date);

    const response = await tenantHttp().get<AppointmentListResponse | Appointment[]>(
      `/api/dental/appointments/by-date?date=${normalizedDate}`
    );

    return extractAppointments(response.data).map(normalizeAppointment);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Appointment Service] getAppointmentsByDate failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load appointments by date"));
  }
}

/**
 * POST /api/dental/appointments
 */
export async function createAppointment(
  payload: CreateAppointmentDto
): Promise<Appointment> {
  try {
    const response = await tenantHttp().post<Appointment>(
      "/api/dental/appointments",
      {
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        appointmentDate: normalizeDateForApi(payload.appointmentDate),
        startTime: normalizeTimeForApi(payload.startTime),
        slotDurationMinutes: Number(payload.slotDurationMinutes),
        notes: payload.notes || "",
      }
    );

    return normalizeAppointment(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Appointment Service] createAppointment failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to create appointment"));
  }
}

/**
 * PUT /api/dental/appointments/:id
 */
export async function updateAppointment(
  appointmentId: string,
  payload: UpdateAppointmentDto
): Promise<Appointment> {
  try {
    const response = await tenantHttp().put<Appointment>(
      `/api/dental/appointments/${appointmentId}`,
      {
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        appointmentDate: normalizeDateForApi(payload.appointmentDate),
        startTime: normalizeTimeForApi(payload.startTime),
        slotDurationMinutes: Number(payload.slotDurationMinutes),
        notes: payload.notes || "",
        status: payload.status || "SCHEDULED",
      }
    );

    return normalizeAppointment(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Appointment Service] updateAppointment failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to update appointment"));
  }
}

/**
 * DELETE /api/dental/appointments/:id
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  try {
    await tenantHttp().delete(`/api/dental/appointments/${appointmentId}`);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Appointment Service] deleteAppointment failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to delete appointment"));
  }
}