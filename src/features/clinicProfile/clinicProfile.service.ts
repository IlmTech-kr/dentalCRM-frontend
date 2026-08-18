import { tenantHttp, publicTenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type { ClinicPublicProfile } from "@/src/types/clinicProfile.types";

/**
 * GET /api/v1/clinic/public-profile — CLINIC_ADMIN o'z klinikasining
 * ommaviy profilini oladi (Settings > Socials shu yerdan o'qiydi).
 */
export async function getClinicProfile(): Promise<ClinicPublicProfile> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.clinicProfile.get);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load clinic profile"));
  }
}

/**
 * PUT /api/v1/clinic/public-profile — to'liq obyekt almashtiriladi deb
 * faraz qilingan, shuning uchun chaqiruvchi o'zgarmagan maydonlarni ham
 * (companyName/bio/imageUrl/phoneNumber/email) qayta yuborishi kerak.
 */
export async function updateClinicProfile(
  payload: ClinicPublicProfile
): Promise<ClinicPublicProfile> {
  try {
    const http = tenantHttp();
    const response = await http.put(ENDPOINTS.clinicProfile.update, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update clinic profile"));
  }
}

/**
 * GET /api/public/clinics — autentifikatsiyasiz. publicTenantHttp — xuddi
 * tenantHttp kabi joriy subdomain'dan bazaviy URL quradi, lekin 401
 * bo'lsa refresh/redirect interceptorisiz (bu sahifada sessiya umuman
 * bo'lmasligi mumkin — chet foydalanuvchi).
 */
export async function getPublicClinicProfile(): Promise<ClinicPublicProfile> {
  try {
    const http = publicTenantHttp();
    const response = await http.get(ENDPOINTS.clinicProfile.public);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load public clinic profile"));
  }
}
