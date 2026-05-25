// File: src/features/patients/patient.service.ts
import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
} from "@/src/types/patient.types";
import { AxiosError } from "axios";
import { getCurrentSubdomain } from "@/src/lib/utils/tenant";


/**
 * Extract only digits from phone number
 * Input: "+998 90 123 45 67"
 * Output: "998901234567"
 */
function extractPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Normalize API response to Patient array
 */
function normalizePatientsResponse(responseData: any): Patient[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (responseData?.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }

  if (responseData?.content && Array.isArray(responseData.content)) {
    return responseData.content;
  }

  if (responseData?.patients && Array.isArray(responseData.patients)) {
    return responseData.patients;
  }

  return [];
}

/**
 * Get all patients
 */
export async function getPatients(): Promise<Patient[]> {
  try {
    const subDomain = getCurrentSubdomain();

    if (!subDomain) {
      throw new Error("No tenant subdomain found");
    }

    const http = tenantHttp(subDomain);
    const response = await http.get(ENDPOINTS.patients.list);

    console.log("[Patient Service] getPatients response:", response.data);

    return normalizePatientsResponse(response.data);
  } catch (error) {
    console.error("Failed to load patients:", error);
    throw new Error("Failed to load patients");
  }
}

/**
 * Get patient by ID
 */
export async function getPatientById(id: string): Promise<Patient> {
  try {
    const subDomain = getCurrentSubdomain();

    if (!subDomain) {
      throw new Error("No tenant subdomain found");
    }

    const http = tenantHttp(subDomain);
    const response = await http.get<Patient>(ENDPOINTS.patients.byId(id));

    return response.data;
  } catch (error) {
    console.error("Failed to load patient:", error);

    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || "Failed to load patient";
      throw new Error(message);
    }

    throw error;
  }
}

/**
 * Search patients by phone number
 * ✅ FIXED: Sends only digits to API (no +998 or spaces)
 */
export async function searchPatientByPhone(phone: string): Promise<Patient[]> {
  try {
    const subDomain = getCurrentSubdomain();

    if (!subDomain) {
      console.error("[Patient Service] No subdomain found");
      throw new Error("No tenant subdomain found");
    }

    if (!phone || !phone.trim()) {
      console.warn("[Patient Service] Empty phone number");
      return [];
    }

    // ✅ FIXED: Extract only digits before sending to API
    const phoneDigits = extractPhoneDigits(phone);

    if (phoneDigits.length < 12) {
      console.warn("[Patient Service] Phone number incomplete");
      return [];
    }

    const http = tenantHttp(subDomain);

    // ✅ Send only digits to API (no +998, no spaces)
    const searchParam = encodeURIComponent(phoneDigits);
    const endpoint = `${ENDPOINTS.patients.list}?search=${searchParam}`;

    console.log("[Patient Service] Phone search:", {
      original: phone,
      digits: phoneDigits,
      endpoint: endpoint,
      subdomain: subDomain,
    });

    const response = await http.get(endpoint);

    console.log("[Patient Service] Search response:", response.data);

    const results = normalizePatientsResponse(response.data);

    console.log("[Patient Service] Search results:", {
      count: results.length,
      results: results.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        phone: p.phone,
      })),
    });

    return results;
  } catch (error) {
    console.error("[Patient Service] Search error:", error);

    if (error instanceof AxiosError) {
      console.error("[Patient Service] API Error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
      });
    }

    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * Create new patient
 */
export async function createPatient(
  payload: CreatePatientDto
): Promise<Patient> {
  try {
    const subDomain = getCurrentSubdomain();

    if (!subDomain) {
      throw new Error("No tenant subdomain found");
    }

    const http = tenantHttp(subDomain);
    const response = await http.post<Patient>(
      ENDPOINTS.patients.list,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Failed to create patient:", error);

    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || "Failed to create patient";
      throw new Error(message);
    }

    throw error;
  }
}

/**
 * Update patient
 */
export async function updatePatient(
  id: string,
  payload: UpdatePatientDto
): Promise<Patient> {
  try {
    const subDomain = getCurrentSubdomain();

    if (!subDomain) {
      throw new Error("No tenant subdomain found");
    }

    const http = tenantHttp(subDomain);
    const response = await http.put<Patient>(
      ENDPOINTS.patients.byId(id),
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Failed to update patient:", error);

    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || "Failed to update patient";
      throw new Error(message);
    }

    throw error;
  }
}

/**
 * Delete patient
 */
export async function deletePatient(id: string): Promise<void> {
  try {
    const subDomain = getCurrentSubdomain();

    if (!subDomain) {
      throw new Error("No tenant subdomain found");
    }

    const http = tenantHttp(subDomain);
    await http.delete(ENDPOINTS.patients.byId(id));
  } catch (error) {
    console.error("Failed to delete patient:", error);

    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || "Failed to delete patient";
      throw new Error(message);
    }

    throw error;
  }
}