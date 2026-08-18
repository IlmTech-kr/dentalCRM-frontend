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
 * Backend Spring Pageable qaytarsa (content/totalPages/...), bu yerda
 * faqat bitta sahifaning array qismini ajratib olamiz — sahifalash
 * (barcha sahifalarni yig'ish) getPatients() ichida bajariladi.
 */
function extractPatientsArray(responseData: any): any[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }
  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }
  if (Array.isArray(responseData?.content)) {
    return responseData.content;
  }
  if (Array.isArray(responseData?.patients)) {
    return responseData.patients;
  }
  if (Array.isArray(responseData?.data?.content)) {
    return responseData.data.content;
  }
  return [];
}

function normalizePatientsResponse(responseData: any): Patient[] {
  return extractPatientsArray(responseData).map(normalizePatient);
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
 * Backend /api/dental/patients javobi: { patients: [...], total: N } —
 * `size` so'ralganidan qat'i nazar backend sahifa hajmini o'zi
 * kichraytiradi (masalan har doim ko'pi bilan 20ta qaytaradi), shuning
 * uchun "kelgan miqdor so'ralgandan kam bo'lsa oxirgi sahifa" degan
 * taxmin ISHLAMAYDI. Shu sababli `page`ni oshirib, `total`ga yetguncha
 * davom etiladi.
 *
 * `page` parametri e'tiborga olinmasligi (va har doim bitta xil sahifa
 * qaytishi) ehtimoliga qarshi — id bo'yicha dedup qilinadi: yangi
 * sahifada bironta ham yangi id kelmasa, bu backend ilgarilamayotganini
 * anglatadi va cheksiz/takroriy yig'ishning oldini olish uchun to'xtaymiz.
 */
const PATIENTS_PAGE_FETCH_SIZE = 200;
const PATIENTS_MAX_PAGES = 100; // xavfsizlik cheklovi — cheksiz loopdan saqlaydi

/**
 * GET /patients
 */
export async function getPatients(): Promise<Patient[]> {
  try {
    const http = tenantHttp();
    const byId = new Map<string, any>();
    let page = 0;
    let total: number | undefined;

    do {
      const response = await http.get(
        `${ENDPOINTS.patients.list}?page=${page}&size=${PATIENTS_PAGE_FETCH_SIZE}`
      );
      const data = response.data;
      const pagePatients = extractPatientsArray(data);

      if (typeof data?.total === "number") {
        total = data.total;
      } else if (typeof data?.totalElements === "number") {
        total = data.totalElements;
      } else if (typeof data?.totalCount === "number") {
        total = data.totalCount;
      }

      let newCount = 0;
      for (const patient of pagePatients) {
        const id = patient?.id || patient?._id;
        const key = id != null ? String(id) : `__idx_${byId.size}_${newCount}`;
        if (!byId.has(key)) newCount += 1;
        byId.set(key, patient);
      }

      if (process.env.NODE_ENV === "development") {
        console.debug("[Patient Service] getPatients page response:", {
          page,
          received: pagePatients.length,
          newCount,
          collected: byId.size,
          total,
        });
      }

      page += 1;

      // Backend sahifalashsiz to'g'ridan-to'g'ri array qaytarsa (Pageable
      // emas) — bitta so'rovda hammasi keladi, qayta so'rash shart emas.
      if (Array.isArray(data)) break;

      // Bo'sh sahifa, oldinga siljimayotgan `page`, yoki total'ga
      // yetilgan bo'lsa — to'xtaymiz.
      if (pagePatients.length === 0) break;
      if (newCount === 0) break;
      if (typeof total === "number" && byId.size >= total) break;
    } while (page < PATIENTS_MAX_PAGES);

    return Array.from(byId.values()).map(normalizePatient);
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
 * PUT /patients/:id
 */
export async function updatePatient(
  payload: UpdatePatientDto
): Promise<Patient> {
  try {
    const http = tenantHttp();

    const { id, ...rest } = normalizePatientPayload(payload);

    const response = await http.put(ENDPOINTS.patients.byId(id), rest);

    return normalizePatient(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Patient Service] updatePatient failed:",
        getApiErrorMessage(error)
      );
    }

    throw new Error(
      getApiErrorMessage(error, "Failed to update patient")
    );
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