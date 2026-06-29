// /**
//  * File: src/features/statistics/services/statistics.service.ts
//  *
//  * CLINIC_ADMIN & SUPER_ADMIN:
//  *   GET clinic1.dental.api.ilmtech.uz/api/dental/statistics/revenue
//  *   → tenantHttp() — subdomain orqali
//  *
//  * SUPER_ADMIN only:
//  *   GET dental.api.ilmtech.uz/api/dental/statistics/revenue/clinics
//  *   → mainHttp — root domain orqali (tenant yo'q)
//  *
//  * Enums:
//  *   filter:    DAY | MONTH | YEAR
//  *   sort:      PERIOD | REVENUE | CLINIC
//  *   direction: ASC | DESC
//  */

// import { tenantHttp, mainHttp, getApiErrorMessage } from "@/src/lib/api/http";
// import { ENDPOINTS } from "@/src/lib/api/endpoints";
// import type {
//   RevenueStatParams,
//   RevenueStatResponse,
//   ClinicRevenueParams,
//   ClinicRevenueItem,
//   DashboardSummary,
// } from "@/src/types/statistics.types";

// /**
//  * CLINIC_ADMIN & SUPER_ADMIN
//  * GET /api/dental/statistics/revenue (tenant subdomain orqali)
//  */
// export async function getRevenueStats(
//   params: RevenueStatParams
// ): Promise<RevenueStatResponse> {
//   try {
//     const response = await tenantHttp().get<RevenueStatResponse>(
//       ENDPOINTS.statistics.revenue,
//       {
//         params: {
//           fromDate:  params.fromDate,
//           toDate:    params.toDate,
//           filter:    params.filter,
//           sort:      params.sort ?? "REVENUE",
//           direction: params.direction ?? "DESC",
//         },
//       }
//     );
//     return response.data;
//   } catch (error) {
//     if (process.env.NODE_ENV === "development") {
//       console.warn("[Statistics] getRevenueStats failed:", getApiErrorMessage(error));
//     }
//     throw new Error(getApiErrorMessage(error, "Failed to load revenue stats"));
//   }
// }

// /**
//  * SUPER_ADMIN only
//  * GET /api/dental/statistics/revenue/clinics (root domain — mainHttp)
//  */
// export async function getClinicRevenueStats(
//   params: ClinicRevenueParams
// ): Promise<ClinicRevenueItem[]> {
//   try {
//     // mainHttp — dental.api.ilmtech.uz (tenant subdomain emas)
//     const response = await mainHttp.get<ClinicRevenueItem[]>(
//       ENDPOINTS.statistics.revenueClinics,
//       {
//         params: {
//           fromDate:  params.fromDate,
//           toDate:    params.toDate,
//           sort:      params.sort ?? "REVENUE",
//           direction: params.direction ?? "DESC",
//         },
//       }
//     );
//     return Array.isArray(response.data)
//       ? response.data
//       : (response.data as any)?.content ?? [];
//   } catch (error) {
//     if (process.env.NODE_ENV === "development") {
//       console.warn("[Statistics] getClinicRevenueStats failed:", getApiErrorMessage(error));
//     }
//     throw new Error(getApiErrorMessage(error, "Failed to load clinic revenue stats"));
//   }
// }

// /**
//  * Dashboard summary
//  * GET /api/dental/statistics/summary
//  */
// export async function getDashboardSummary(): Promise<DashboardSummary> {
//   try {
//     const response = await tenantHttp().get<DashboardSummary>(
//       ENDPOINTS.statistics.summary
//     );
//     return response.data;
//   } catch (error) {
//     if (process.env.NODE_ENV === "development") {
//       console.warn("[Statistics] getDashboardSummary failed:", getApiErrorMessage(error));
//     }
//     throw new Error(getApiErrorMessage(error, "Failed to load dashboard summary"));
//   }
// }