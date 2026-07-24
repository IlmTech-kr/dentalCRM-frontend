/**
 * File:
 * src/features/superadmin/clinics/clinics-admin.service.ts
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
  contactNumber: string | null;
  ownerId: string | null;
  status: string;
  subscriptionStatus: string | null;

  [key: string]: unknown;
}

interface ClinicApiResponse {
  clinics?: ClinicSummary[];
  items?: ClinicSummary[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface ClinicListResponse {
  items: ClinicSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getClinics(
  params: ClinicListParams = {}
): Promise<ClinicListResponse> {
  const { data } = await mainHttp.get<
    ClinicApiResponse | ClinicSummary[]
  >(ENDPOINTS.superAdmin.clinics.list(params));

  const items = Array.isArray(data)
    ? data
    : data.clinics ?? data.items ?? [];

  const page = Array.isArray(data)
    ? params.page ?? 0
    : data.page ?? params.page ?? 0;

  const size = Array.isArray(data)
    ? items.length
    : data.size ?? params.limit ?? items.length;

  const totalElements = Array.isArray(data)
    ? items.length
    : data.totalElements ?? items.length;

  const totalPages = Array.isArray(data)
    ? items.length > 0
      ? 1
      : 0
    : data.totalPages ??
      (size > 0 ? Math.ceil(totalElements / size) : 0);

  return {
    items,
    page,
    size,
    totalElements,
    totalPages,
  };
}

export async function getClinic(
  id: string
): Promise<ClinicSummary> {
  const { data } = await mainHttp.get<
    ClinicSummary | { clinic: ClinicSummary }
  >(ENDPOINTS.superAdmin.clinics.byId(id));

  if (
    typeof data === "object" &&
    data !== null &&
    "clinic" in data
  ) {
    return data.clinic as any;
  }

  return data;
}