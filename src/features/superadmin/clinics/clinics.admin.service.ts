/**
 * File: src/features/superadmin/clinics/clinics-admin.service.ts
 *
 * ClinicSummary shakli /statistics/revenue/clinics javobidagi nested
 * `clinic` obyektidan tasdiqlangan. Ro'yxat/detail endpointi ham xuddi
 * shu shaklda qaytaradi deb faraz qilinmoqda (tasdiqlansa yaxshi bo'lardi).
 */

import { mainHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

export interface ClinicListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ClinicSummary {
  id: string;
  tenantId: string;
  name: string;
  subDomain: string;
  ownerId: string;
  status: string;
  subscriptionStatus: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface ClinicListResponse {
  items: ClinicSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getClinics(params: ClinicListParams): Promise<ClinicListResponse> {
  const { data } = await mainHttp.get(ENDPOINTS.superAdmin.clinics.list(params));
  return data;
}

export async function getClinic(id: string): Promise<ClinicSummary> {
  const { data } = await mainHttp.get(ENDPOINTS.superAdmin.clinics.byId(id));
  return data;
}