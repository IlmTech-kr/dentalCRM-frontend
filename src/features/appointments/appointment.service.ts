import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
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

function normalizeAppointment(appointment: any): Appointment {
  return {
    ...appointment,
    id: appointment.id || appointment._id,

    patientId:
      appointment.patientId ||
      appointment.patient?.id ||
      appointment.patient?._id,

    doctorId:
      appointment.doctorId ||
      appointment.doctor?.id ||
      appointment.doctor?._id,

    patient: appointment.patient
      ? {
          ...appointment.patient,
          id: appointment.patient.id || appointment.patient._id,
        }
      : undefined,

    doctor: appointment.doctor
      ? {
          ...appointment.doctor,
          id: appointment.doctor.id || appointment.doctor._id,
        }
      : undefined,
  };
}

function normalizeAppointmentsResponse(
  result: AppointmentListResponse | Appointment[] | any
): Appointment[] {
  const appointments = Array.isArray(result)
    ? result
    : result.data ||
      result.content ||
      result.appointments ||
      result.schedules ||
      [];

  return appointments.map(normalizeAppointment);
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
    ENDPOINTS.appointments.list,
    {
      params: {
        page,
        limit,
      },
    }
  );

  return normalizeAppointmentsResponse(response.data);
}

/**
 * GET /api/dental/appointments/by-date?date=2026-06-06
 */
export async function getAppointmentsByDate(
  date: string
): Promise<Appointment[]> {
  const http = getHttp();

  const response = await http.get<AppointmentListResponse | Appointment[]>(
    ENDPOINTS.appointments.byDate,
    {
      params: {
        date,
      },
    }
  );

  return normalizeAppointmentsResponse(response.data);
}

/**
 * GET /api/dental/appointments/:id
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<Appointment> {
  const http = getHttp();

  const response = await http.get(
    ENDPOINTS.appointments.byId(appointmentId)
  );

  return normalizeAppointment(response.data);
}

/**
 * POST /api/dental/appointments
 *
 * Roles:
 * RECEPTIONIST, CLINIC_ADMIN
 */
export async function createAppointment(
  payload: CreateAppointmentDto
): Promise<Appointment> {
  const http = getHttp();

  const response = await http.post(
    ENDPOINTS.appointments.list,
    payload
  );

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

  const response = await http.put(
    ENDPOINTS.appointments.byId(appointmentId),
    payload
  );

  return normalizeAppointment(response.data);
}

/**
 * DELETE /api/dental/appointments/:id
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  const http = getHttp();

  await http.delete(ENDPOINTS.appointments.byId(appointmentId));
}