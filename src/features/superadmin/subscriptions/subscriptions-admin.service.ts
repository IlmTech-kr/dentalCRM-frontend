/**
 * File: src/features/superadmin/subscriptions/subscriptions-admin.service.ts
 */

import { mainHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "TRIAL" | "EXPIRED";

/**
 * GET /api/dental/subscriptions/admin/tenants javobidagi bitta element.
 * Diqqat: bu yerda klinika nomi/subdomain YO'Q — faqat obuna holati.
 */
export interface TenantSubscription {
  tenantId: string;
  currentPlan: string;
  status: TenantStatus | string;
  startDate: string;
  endDate: string;
  smsBalance: number;
  currentStorageBytes: number;
  lastPaymentTransactionId: string | null;
  lastActivatedAt: string;
}

export interface TenantListResponse {
  items: TenantSubscription[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TenantListParams {
  status?: TenantStatus;
  page?: number;
  limit?: number;
}

export async function getTenants(
  params: TenantListParams
): Promise<TenantListResponse> {
  const { data } = await mainHttp.get(
    ENDPOINTS.subscriptions.admin.tenants.list(params)
  );
  return data;
}

export async function suspendTenant(tenantId: string) {
  const { data } = await mainHttp.post(
    ENDPOINTS.subscriptions.admin.tenants.suspend(tenantId)
  );
  return data;
}

export async function getTenantLimits(tenantId: string) {
  const { data } = await mainHttp.get(
    ENDPOINTS.subscriptions.admin.tenants.limits(tenantId)
  );
  return data;
}

export async function updateTenantLimits(
  tenantId: string,
  payload: Record<string, unknown>
) {
  const { data } = await mainHttp.put(
    ENDPOINTS.subscriptions.admin.tenants.limits(tenantId),
    payload
  );
  return data;
}

/**
 * GET /api/dental/subscriptions/admin/plans javobidagi bitta tarif.
 * Diqqat: massiv to'g'ridan-to'g'ri qaytadi (items/data bilan o'ralmagan),
 * va identifikator maydoni `code` emas — `planType`.
 */
export interface SubscriptionPlan {
  planType: string;
  monthlyPrice: number;
  durationMonths: number;
  maxDoctors: number;
  maxStaff: number;
  storageLimitBytes: number;
  includedSmsCount: number;
  active: boolean;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await mainHttp.get(ENDPOINTS.subscriptions.admin.plans.list);
  return data;
}

export async function getPlan(planType: string): Promise<SubscriptionPlan> {
  const { data } = await mainHttp.get(
    ENDPOINTS.subscriptions.admin.plans.byCode(planType)
  );
  return data;
}

export interface ActivateSubscriptionPayload {
  tenantId: string;
  planType: string;
  [key: string]: unknown;
}

export async function activateSubscription(payload: ActivateSubscriptionPayload) {
  const { data } = await mainHttp.post(ENDPOINTS.subscriptions.activate, payload);
  return data;
}