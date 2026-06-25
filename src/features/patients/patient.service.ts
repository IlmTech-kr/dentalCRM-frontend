/**
 * File: src/features/patients/patient.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
} from "@/src/types/patient.types";

// ---------------------------------------------------------------------------
// Phone helpers
// ---------------------------------------------------------------------------

/**
 * Faqat raqamlarni qoldiradi.
 *
 * "+998 93 491 91 00" → "998934919100"
 */
function extractPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Backendga bir xil formatda yuboriladi: +998XXXXXXXXX (12 raqam + "+")
 *
 * Hook da enabled: length === 12 kafolatlaydi,
 * shuning uchun bu yerda ham 12 raqam tekshiramiz — izchillik uchun.
 */
function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;

  const digits = extractPhoneDigits(phone);

  if (digits.length !== 12) return undefined;

  return `+${digits}`;
}

// ---------------------------------------------------------------------------
// Response normalizers
// ---------------------------------------------------------------------------

/**
 * Backenddan _id kelsa id ga normalize qilamiz.
 * phone / phoneNumber ham bir xil bo'lib ishlaydi.
 */
function normalizePatient(patient: any): Patient {
  return {
    ...patient,
    id: patient.id || patient._id,
    phone: patient.phone || patient.phoneNumber || "",
    phoneNumber: patient.phoneNumber || patient.phone || "",
  } as Patient;
}

/**
 * API response har xil formatda kelsa ham array qilib olamiz.
 */
function normalizePatientsResponse(responseData: any): Patient[] {
  let patients: any[] = [];

  if (Array.isArray(responseData)) {
    patients = responseData;
  } else if (Array.isArray(responseData?.data)) {
    patients = responseData.data;
  } else if (Array.isArray(responseData?.content)) {
    patients = responseData.content;
  } else if (Array.isArray(responseData?.patients)) {
    patients = responseData.patients;
  } else if (Array.isArray(responseData?.data?.content)) {
    patients = responseData.data.content;
  } else {
    patients = [];
  }

  return patients.map(normalizePatient);
}

// ---------------------------------------------------------------------------
// Payload normalizer
// ---------------------------------------------------------------------------

function normalizePatientPayload<T extends CreatePatientDto | UpdatePatientDto>(
  payload: T
): T {
  const rawPhone = (payload as any).phone || (payload as any).phoneNumber;
  const normalizedPhone = normalizePhone(rawPhone);

  if (!normalizedPhone) {
    return payload;
  }

  return {
    ...payload,
    phone: normalizedPhone,
    phoneNumber: normalizedPhone,
  } as T;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * GET /patients
 */
export async function getPatients(): Promise<Patient[]> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.patients.list);

    if (process.env.NODE_ENV === "development") {
      console.debug("[Patient Service] getPatients response:", response.data);
    }

    return normalizePatientsResponse(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Patient Service] getPatients failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load patients"));
  }
}

/**
 * GET /patients/:id
 */
export async function getPatientById(id: string): Promise<Patient> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.patients.byId(id));

    return normalizePatient(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Patient Service] getPatientById failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to load patient"));
  }
}

/**
 * GET /patients?search=998XXXXXXXXX
 *
 * Hook da enabled: cleanPhone.length === 12 kafolatlaydi.
 * Service da ham izchillik uchun 12 raqam tekshiramiz.
 *
 * Input:  "+998934919100" yoki "998934919100"
 * Search: "998934919100"
 */
export async function searchPatientByPhone(phone: string): Promise<Patient[]> {
  try {
    if (!phone?.trim()) return [];

    const phoneDigits = extractPhoneDigits(phone);

    if (phoneDigits.length !== 12) return [];

    const http = tenantHttp();
    const endpoint = `${ENDPOINTS.patients.list}?search=${encodeURIComponent(phoneDigits)}`;

    if (process.env.NODE_ENV === "development") {
      console.debug("[Patient Service] searchPatientByPhone:", {
        original: phone,
        digits: phoneDigits,
        endpoint,
      });
    }

    const response = await http.get(endpoint);

    return normalizePatientsResponse(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Patient Service] searchPatientByPhone failed:", getApiErrorMessage(error));
    }

    return [];
  }
}

/**
 * POST /patients
 */
export async function createPatient(payload: CreatePatientDto): Promise<Patient> {
  try {
    const http = tenantHttp();
    const normalizedPayload = normalizePatientPayload(payload);
    const response = await http.post(ENDPOINTS.patients.list, normalizedPayload);

    return normalizePatient(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Patient Service] createPatient failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to create patient"));
  }
}

/**
 * PATCH /patients/:id
 *
 * UpdatePatientDto partial bo'lgani uchun PATCH ishlatiladi.
 * Agar backend PUT kutsa — shu yerda o'zgartirish kifoya.
 */
export async function updatePatient(
  id: string,
  payload: UpdatePatientDto
): Promise<Patient> {
  try {
    const http = tenantHttp();
    const normalizedPayload = normalizePatientPayload(payload);
    const response = await http.patch(ENDPOINTS.patients.byId(id), normalizedPayload);

    return normalizePatient(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Patient Service] updatePatient failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to update patient"));
  }
}

/**
 * DELETE /patients/:id
 */
export async function deletePatient(id: string): Promise<void> {
  try {
    const http = tenantHttp();
    await http.delete(ENDPOINTS.patients.byId(id));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Patient Service] deletePatient failed:", getApiErrorMessage(error));
    }

    throw new Error(getApiErrorMessage(error, "Failed to delete patient"));
  }
}