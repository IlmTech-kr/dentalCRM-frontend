/**
 * File:
 * src/features/superadmin/subscriptions/subscriptions-admin.service.ts
 */

import { mainHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

export type TenantStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "TRIAL"
  | "EXPIRED"
  | "CANCELED";

export interface TenantSubscription {
  tenantId: string;
  currentPlan: string;
  status: TenantStatus;

  startDate: string | null;
  endDate: string | null;

  smsBalance: number;
  currentStorageBytes: number;

  lastPaymentTransactionId: string | null;
  lastActivatedAt: string | null;
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
  params: TenantListParams = {}
): Promise<TenantListResponse> {
  const { data } = await mainHttp.get<TenantListResponse>(
    ENDPOINTS.subscriptions.admin.tenants.list(params)
  );

  return data;
}

export async function suspendTenant(
  tenantId: string
) {
  const { data } = await mainHttp.post(
    ENDPOINTS.subscriptions.admin.tenants.suspend(tenantId)
  );

  return data;
}

export interface TenantLimits {
  [key: string]: unknown;
}

export async function getTenantLimits(
  tenantId: string
): Promise<TenantLimits> {
  const { data } = await mainHttp.get<TenantLimits>(
    ENDPOINTS.subscriptions.admin.tenants.limits(tenantId)
  );

  return data;
}

export async function updateTenantLimits(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<TenantLimits> {
  const { data } = await mainHttp.put<TenantLimits>(
    ENDPOINTS.subscriptions.admin.tenants.limits(tenantId),
    payload
  );

  return data;
}

/* =====================================================
 * PLANS
 * ===================================================== */

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

/**
 * PUT endpoint partial body qabul qilgani uchun
 * barcha maydonlarni yuborish shart emas.
 *
 * Misol:
 * {
 *   monthlyPrice: 500000
 * }
 */
export type UpdateSubscriptionPlanPayload = Partial<
  Omit<SubscriptionPlan, "planType">
>;

export async function getPlans(): Promise<
  SubscriptionPlan[]
> {
  const { data } = await mainHttp.get<SubscriptionPlan[]>(
    ENDPOINTS.subscriptions.admin.plans.list
  );

  return Array.isArray(data) ? data : [];
}

export async function getPlan(
  planType: string
): Promise<SubscriptionPlan> {
  const { data } = await mainHttp.get<SubscriptionPlan>(
    ENDPOINTS.subscriptions.admin.plans.byCode(planType)
  );

  return data;
}

/**
 * PUT /api/dental/subscriptions/admin/plans/{planType}
 */
export async function updatePlan(
  planType: string,
  payload: UpdateSubscriptionPlanPayload
): Promise<SubscriptionPlan> {
  const { data } = await mainHttp.put<SubscriptionPlan>(
    ENDPOINTS.subscriptions.admin.plans.byCode(planType),
    payload
  );

  return data;
}

/* =====================================================
 * ACTIVATE
 * ===================================================== */

export interface ActivateSubscriptionPayload {
  tenantId: string;
  planType: string;
  [key: string]: unknown;
}

export async function activateSubscription(
  payload: ActivateSubscriptionPayload
) {
  const { data } = await mainHttp.post(
    ENDPOINTS.subscriptions.activate,
    payload
  );

  return data;
}