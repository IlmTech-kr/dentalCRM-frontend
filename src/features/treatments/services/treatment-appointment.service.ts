import { tenantHttp } from "@/src/lib/api/http";
import type { TreatmentAppointment } from "@/src/types/treatment-appointment.types";

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

function normalizeAppointment(item: any): TreatmentAppointment {
  return {
    ...item,
    id: item?.id || item?._id,
    patientId: item?.patientId || item?.patient?.id || item?.patient?._id,
    doctorId: item?.doctorId || item?.doctor?.id || item?.doctor?._id,
  };
}

function extractArray(data: any): any[] {
  const body = data?.data ?? data;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.appointments)) return body.appointments;
  if (Array.isArray(body?.data)) return body.data;

  return [];
}

function getAppointmentDateValue(item: TreatmentAppointment): string {
  return (
    item.appointmentDate ||
    item.date ||
    item.visitDate ||
    item.scheduledAt ||
    item.startTime ||
    ""
  );
}

function isSameDate(item: TreatmentAppointment, yyyyMmDd: string) {
  const value = getAppointmentDateValue(item);
  if (!value) return false;

  return String(value).slice(0, 10) === yyyyMmDd;
}

function isInProgress(item: TreatmentAppointment) {
  return String(item.status || "").toUpperCase() === "IN_PROGRESS";
}

function sortByTime(a: TreatmentAppointment, b: TreatmentAppointment) {
  const aValue = getAppointmentDateValue(a) || a.startTime || "";
  const bValue = getAppointmentDateValue(b) || b.startTime || "";

  return String(aValue).localeCompare(String(bValue));
}

export const treatmentAppointmentService = {
  async getTodayInProgress(date: string): Promise<TreatmentAppointment[]> {
    const http = getHttp();

    const requests = [
      `/api/dental/appointments?date=${encodeURIComponent(
        date
      )}&status=IN_PROGRESS`,

      `/api/dental/appointments?appointmentDate=${encodeURIComponent(
        date
      )}&status=IN_PROGRESS`,

      `/api/dental/appointments?date=${encodeURIComponent(date)}`,

      `/api/dental/appointments`,
    ];

    let lastError: unknown = null;

    for (const url of requests) {
      try {
        const res = await http.get(url);

        const list = extractArray(res.data).map(normalizeAppointment);

        return list
          .filter((item) => isSameDate(item, date))
          .filter(isInProgress)
          .sort(sortByTime);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },
};