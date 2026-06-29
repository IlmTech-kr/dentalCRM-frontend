// "use client";

// /**
//  * File: src/features/statistics/hooks/useStatistics.ts
//  */

// import { useQuery } from "@tanstack/react-query";
// import { useAuthStore } from "@/src/store/auth.store";
// import {
//   getRevenueStats,
//   getClinicRevenueStats,
//   getDashboardSummary,
// } from "../services/statistics.service";
// import type {
//   RevenueStatParams,
//   ClinicRevenueParams,
// } from "@/src/types/statistics.types";

// export const statisticsKeys = {
//   all: ["statistics"] as const,
//   revenue: (params: RevenueStatParams) => ["statistics", "revenue", params] as const,
//   clinics: (params: ClinicRevenueParams) => ["statistics", "clinics", params] as const,
//   summary: () => ["statistics", "summary"] as const,
// };

// export function useRevenueStats(params: RevenueStatParams) {
//   const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

//   return useQuery({
//     queryKey: statisticsKeys.revenue(params),
//     queryFn: () => getRevenueStats(params),
//     enabled: isAuthenticated,
//     staleTime: 1000 * 60 * 5,
//     retry: 1,
//   });
// }

// export function useClinicRevenueStats(params: ClinicRevenueParams) {
//   const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

//   return useQuery({
//     queryKey: statisticsKeys.clinics(params),
//     queryFn: () => getClinicRevenueStats(params),
//     enabled: isAuthenticated,
//     staleTime: 1000 * 60 * 5,
//     retry: 1,
//   });
// }

// export function useDashboardSummary() {
//   const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

//   return useQuery({
//     queryKey: statisticsKeys.summary(),
//     queryFn: getDashboardSummary,
//     enabled: isAuthenticated,
//     staleTime: 1000 * 60 * 2,
//     retry: 1,
//   });
// }