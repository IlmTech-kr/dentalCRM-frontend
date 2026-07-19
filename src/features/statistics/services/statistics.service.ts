// File: src/features/statistics/services/statistics.service.ts

import { tenantHttp, mainHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

export type RevenueFilterType = "DAY" | "MONTH" | "YEAR";
export type RevenueSortBy = "PERIOD" | "REVENUE" | "CLINIC";
export type SortDirection = "ASC" | "DESC";
export type CompensationType = "PERCENTAGE" | "SALARY";

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

/**
 * GET /api/dental/statistics/revenue/doctors
 * CLINIC_ADMIN: doctorId bermasa — barcha doctorlar keladi.
 * DOCTOR: o'z statistikasini ko'radi.
 */
export interface DoctorRevenueStatItem {
  doctorId: string;
  doctorName: string;
  revenue: number;
  transactionCount: number;
  compensationType: CompensationType;
  commissionPercentage: number | null;
  estimatedCommissionAmount: number | null;
}

export interface DoctorRevenueParams {
  fromDate: string;
  toDate: string;
  doctorId?: string;
}

/**
 * GET /api/dental/statistics/payroll
 * CLINIC_ADMIN only — klinikaning umumiy oylik/komissiya chiqimlari.
 */
export interface PayrollDoctorDetail {
  doctorId: string;
  doctorName: string;
  compensationType: CompensationType;
  salaryAmount: number | null;
  revenue: number;
  commissionPercentage: number | null;
  commissionAmount: number;
  totalCost: number;
}

export interface PayrollStaffDetail {
  staffId: string;
  staffName: string;
  role: string;
  salaryAmount: number;
  totalCost: number;
}

export interface PayrollSummaryResponse {
  fromDate: string;
  toDate: string;
  totalSalaryExpense: number;
  totalCommissionExpense: number;
  totalExpense: number;
  doctorDetails: PayrollDoctorDetail[];
  staffDetails: PayrollStaffDetail[];
}

export interface PayrollParams {
  fromDate: string;
  toDate: string;
}

// ---------------------------------------------------------------------------
// CLINIC_ADMIN & SUPER_ADMIN — tenant API
// ---------------------------------------------------------------------------

/**
 * GET /api/dental/statistics/revenue
 */
export async function getRevenue(params: RevenueParams): Promise<RevenueResponse> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.statistics.revenue(params));
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Statistics Service] getRevenue failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load revenue statistics"));
  }
}

// ---------------------------------------------------------------------------
// SUPER_ADMIN only — main/root API
// ---------------------------------------------------------------------------

/**
 * GET /api/dental/statistics/revenue/clinics
 */
export async function getRevenueByClinic(
  params: Omit<RevenueParams, "filter">
): Promise<RevenueByClinicItem[]> {
  try {
    const response = await mainHttp.get(ENDPOINTS.statistics.revenueByClinic(params));
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Statistics Service] getRevenueByClinic failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load clinic revenue statistics"));
  }
}

// ---------------------------------------------------------------------------
// CLINIC_ADMIN (barcha doctorlar) & DOCTOR (o'zinikini) — tenant API
// ---------------------------------------------------------------------------

/**
 * GET /api/dental/statistics/revenue/doctors
 */
export async function getDoctorRevenueStatistics(
  params: DoctorRevenueParams
): Promise<DoctorRevenueStatItem[]> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.statistics.doctorRevenue(params));
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Statistics Service] getDoctorRevenueStatistics failed:",
        getApiErrorMessage(error)
      );
    }
    throw new Error(
      getApiErrorMessage(error, "Failed to load doctor revenue statistics")
    );
  }
}

// ---------------------------------------------------------------------------
// CLINIC_ADMIN only — tenant API
// ---------------------------------------------------------------------------

/**
 * GET /api/dental/statistics/payroll
 */
export async function getPayrollSummary(
  params: PayrollParams
): Promise<PayrollSummaryResponse> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.statistics.payroll(params));
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Statistics Service] getPayrollSummary failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load payroll summary"));
  }
}