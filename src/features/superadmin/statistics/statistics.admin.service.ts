/**
 * File: src/features/superadmin/statistics/statistics-admin.service.ts
 */

import { mainHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type { ClinicSummary } from "@/src/features/superadmin/clinics/clinics.admin.service";

export interface RevenueByClinicParams {
  fromDate: string;
  toDate: string;
  sort?: "PERIOD" | "REVENUE" | "CLINIC";
  direction?: "ASC" | "DESC";
}

export interface ClinicRevenueRow {
  tenantId: string;
  revenue: number;
  transactionCount: number;
  clinic: ClinicSummary;
}

export async function getRevenueByClinic(
  params: RevenueByClinicParams
): Promise<ClinicRevenueRow[]> {
  const { data } = await mainHttp.get(ENDPOINTS.statistics.revenueByClinic(params));
  return data;
}