// File: src/features/statistics/hooks/useStatistics.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getRevenue,
  getRevenueByClinic,
  getDoctorRevenueStatistics,
  getPayrollSummary,
  RevenueParams,
  RevenueResponse,
  RevenueByClinicItem,
  DoctorRevenueParams,
  DoctorRevenueStatItem,
  PayrollParams,
  PayrollSummaryResponse,
} from "../services/statistics.service";

export const statisticsKeys = {
  all: ["statistics"] as const,
  revenue: (params: RevenueParams) =>
    [...statisticsKeys.all, "revenue", params] as const,
  revenueByClinic: (params: Omit<RevenueParams, "filter">) =>
    [...statisticsKeys.all, "revenueByClinic", params] as const,
  doctorRevenue: (params: DoctorRevenueParams) =>
    [...statisticsKeys.all, "doctorRevenue", params] as const,
  payroll: (params: PayrollParams) =>
    [...statisticsKeys.all, "payroll", params] as const,
};

/**
 * CLINIC_ADMIN & SUPER_ADMIN — umumiy daromad statistikasi (DAY/MONTH/YEAR).
 */
export function useRevenue(params: RevenueParams & { enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<RevenueResponse>({
    queryKey: statisticsKeys.revenue(queryParams),
    queryFn: () => getRevenue(queryParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled,
  });
}

/**
 * SUPER_ADMIN only — klinikalar bo'yicha daromad taqqoslash.
 */
export function useRevenueByClinic(params: Omit<RevenueParams, "filter">) {
  return useQuery<RevenueByClinicItem[]>({
    queryKey: statisticsKeys.revenueByClinic(params),
    queryFn: () => getRevenueByClinic(params),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

/**
 * CLINIC_ADMIN: doctorId bermasa — barcha doctorlar ro'yxati qaytadi.
 * DOCTOR: o'z statistikasini ko'rish uchun (doctorId ixtiyoriy).
 * fromDate/toDate tanlanmaguncha so'rov ketmaydi.
 */
export function useDoctorRevenueStatistics(
  params: DoctorRevenueParams & { enabled?: boolean }
) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<DoctorRevenueStatItem[]>({
    queryKey: statisticsKeys.doctorRevenue(queryParams),
    queryFn: () => getDoctorRevenueStatistics(queryParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: enabled && Boolean(queryParams.fromDate && queryParams.toDate),
  });
}

/**
 * CLINIC_ADMIN only — klinikaning umumiy daromad/chiqim (payroll) hisoboti.
 */
export function usePayrollSummary(params: PayrollParams & { enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<PayrollSummaryResponse>({
    queryKey: statisticsKeys.payroll(queryParams),
    queryFn: () => getPayrollSummary(queryParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: enabled && Boolean(queryParams.fromDate && queryParams.toDate),
  });
}