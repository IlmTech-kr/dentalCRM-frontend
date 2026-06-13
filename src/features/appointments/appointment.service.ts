import { tenantHttp } from "@/src/lib/api/http";

import type {
  Appointment,
  AppointmentListResponse,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "@/src/types/appointment.types";

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

function normalizeAppointmentTime(time?: string | null): string {
  if (!time) return "";

  const value = String(time).trim();

  /**
   * Backend returns:
   * "11:00:00"
   *
   * Frontend input type="time" needs:
   * "11:00"
   */
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return value;
}

function normalizeTimeForApi(time?: string | null): string {
  if (!time) return "";

  const value = String(time).trim();

  /**
   * Backend expects:
   * "11:00:00"
   *
   * Frontend sends:
   * "11:00"
   */
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

  /**
   * Already correct:
   * "2026-05-27"
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  /**
   * Fixes this backend error:
   * "Wed May 27 00:00:00 GMT+05:00 2026"
   */
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

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  const duration = endTotal - startTotal;

  if (duration <= 0) return undefined;

  return duration;
}

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

/**
 * GET /api/dental/appointments?page=0&limit=10
 */
export async function getAppointments(
  page = 0,
  limit = 10
): Promise<Appointment[]> {
  const http = getHttp();

  const response = await http.get<AppointmentListResponse | Appointment[]>(
    `/api/dental/appointments?page=${page}&limit=${limit}`
  );

  const appointments = extractAppointments(response.data);

  return appointments.map(normalizeAppointment);
}

/**
 * GET /api/dental/appointments/:id
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<Appointment> {
  const http = getHttp();

  const response = await http.get<Appointment>(
    `/api/dental/appointments/${appointmentId}`
  );

  return normalizeAppointment(response.data);
}

/**
 * GET /api/dental/appointments/by-date?date=2026-06-06
 */
export async function getAppointmentsByDate(
  date: string | Date
): Promise<Appointment[]> {
  const http = getHttp();

  const normalizedDate = normalizeDateForApi(date);

  const response = await http.get<AppointmentListResponse | Appointment[]>(
    `/api/dental/appointments/by-date?date=${normalizedDate}`
  );

  const appointments = extractAppointments(response.data);

  return appointments.map(normalizeAppointment);
}

/**
 * POST /api/dental/appointments
 *
 * Role: RECEPTIONIST, CLINIC_ADMIN
 */
export async function createAppointment(
  payload: CreateAppointmentDto
): Promise<Appointment> {
  const http = getHttp();

  const response = await http.post<Appointment>("/api/dental/appointments", {
    patientId: payload.patientId,
    doctorId: payload.doctorId,
    appointmentDate: normalizeDateForApi(payload.appointmentDate),
    startTime: normalizeTimeForApi(payload.startTime),
    slotDurationMinutes: Number(payload.slotDurationMinutes),
    notes: payload.notes || "",
  });

  return normalizeAppointment(response.data);
}

/**
 * PUT /api/dental/appointments/:id
 */
export async function updateAppointment(
  appointmentId: string,
  payload: UpdateAppointmentDto
): Promise<Appointment> {
  const http = getHttp();

  const response = await http.put<Appointment>(
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
}

/**
 * DELETE /api/dental/appointments/:id
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  const http = getHttp();

  await http.delete(`/api/dental/appointments/${appointmentId}`);
}