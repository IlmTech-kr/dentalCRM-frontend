// File: src/features/statistics/statistics.service.ts

import { tenantHttp, mainHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

export type RevenueFilterType = "DAY" | "MONTH" | "YEAR";
export type RevenueSortBy = "PERIOD" | "REVENUE" | "CLINIC";
export type SortDirection = "ASC" | "DESC";

export interface RevenuePoint {
  period: string;
  revenue: number;
  transactionCount: number;
}

export interface RevenueResponse {
  filter: RevenueFilterType;
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalTransactionCount: number;
  points: RevenuePoint[];
}

export interface RevenueByClinicItem {
  clinicId: string;
  clinicName: string;
  subDomain?: string;
  revenue: number;
  count?: number;
}

export interface RevenueParams {
  fromDate: string;
  toDate: string;
  filter?: RevenueFilterType;
  sort?: RevenueSortBy;
  direction?: SortDirection;
}

// CLINIC_ADMIN & SUPER_ADMIN — tenant API
export async function getRevenue(params: RevenueParams): Promise<RevenueResponse> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.statistics.revenue(params));
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load revenue statistics"));
  }
}

// SUPER_ADMIN only — main/root API
export async function getRevenueByClinic(
  params: Omit<RevenueParams, "filter">
): Promise<RevenueByClinicItem[]> {
  try {
    const response = await mainHttp.get(ENDPOINTS.statistics.revenueByClinic(params));
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load clinic revenue statistics"));
  }
}