/**
 * File: src/features/superadmin/auth/superadmin-auth.service.ts
 *
 * SUPER_ADMIN har doim mainHttp (subdomainsiz, MAIN_API_URL) orqali ishlaydi.
 * admin.dental.ilmtech.uz'da ochilgan bo'lsa ham, backendga so'rov
 * to'g'ridan-to'g'ri dental.api.ilmtech.uz ga ketadi.
 */

import { mainHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

export interface SuperAdminLoginPayload {
  email: string;
  password: string;
}

export async function superAdminLogin(payload: SuperAdminLoginPayload) {
  const { data } = await mainHttp.post(ENDPOINTS.superAdmin.login, payload);
  return data;
}

export async function getSuperAdminMe() {
  const { data } = await mainHttp.get(ENDPOINTS.users.me);
  return data;
}