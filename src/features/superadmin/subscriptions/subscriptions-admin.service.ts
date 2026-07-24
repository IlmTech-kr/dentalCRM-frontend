/**
 * File:
 * src/features/superadmin/subscriptions/subscriptions-admin.service.ts
 */

import { mainHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

/* =====================================================
 * TENANT SUBSCRIPTIONS
 * ===================================================== */

export type TenantStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "TRIAL"
  | "EXPIRED"
  | "CANCELED";

/**
 * GET /api/dental/subscriptions/admin/tenants
 * endpointidagi bitta subscription.
 *
 * Bu obyekt ichida klinika nomi va subdomain yo‘q.
 * Klinika ma’lumotlari clinics endpointidan olinadi.
 */
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

  [key: string]: unknown;
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

/**
 * Tenantlar subscription ro‘yxatini olish.
 */
export async function getTenants(
  params: TenantListParams = {}
): Promise<TenantListResponse> {
  const { data } =
    await mainHttp.get<TenantListResponse>(
      ENDPOINTS.subscriptions.admin.tenants.list(params)
    );

  return {
    items: data.items ?? [],
    page: data.page ?? params.page ?? 0,
    size: data.size ?? params.limit ?? 10,
    totalElements:
      data.totalElements ?? data.items?.length ?? 0,
    totalPages: data.totalPages ?? 0,
  };
}

/**
 * Tenant subscriptionini suspend qilish.
 */
export async function suspendTenant(
  tenantId: string
): Promise<unknown> {
  const { data } = await mainHttp.post(
    ENDPOINTS.subscriptions.admin.tenants.suspend(
      tenantId
    )
  );

  return data;
}

/* =====================================================
 * TENANT LIMITS
 * ===================================================== */

/**
 * Backend limit response maydonlari o‘zgarishi mumkin.
 *
 * Aniq maydonlar ma’lum bo‘lganda bu interfacega
 * qo‘shib borish mumkin.
 */
export interface TenantLimits {
  tenantId?: string;

  maxDoctors?: number;
  maxStaff?: number;
  maxAssistants?: number;
  maxReceptionists?: number;
  maxPatients?: number;
  maxAppointments?: number;

  storageLimitBytes?: number;
  maxStorageBytes?: number;
  currentStorageBytes?: number;

  includedSmsCount?: number;
  smsLimit?: number;
  smsBalance?: number;

  [key: string]: unknown;
}

interface TenantLimitsApiResponse {
  data?: TenantLimits;
  limits?: TenantLimits;

  [key: string]: unknown;
}

/**
 * Limits endpoint ba’zida:
 *
 * { ...limits }
 *
 * yoki:
 *
 * { data: { ...limits } }
 *
 * yoki:
 *
 * { limits: { ...limits } }
 *
 * shaklida kelishi mumkin.
 */
function normalizeTenantLimits(
  response: TenantLimits | TenantLimitsApiResponse
): TenantLimits {
  if (
    response &&
    typeof response === "object" &&
    "limits" in response &&
    response.limits &&
    typeof response.limits === "object"
  ) {
    return response.limits as any;
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data &&
    typeof response.data === "object"
  ) {
    return response.data as any; 
  }

  return response as TenantLimits;
}

/**
 * Tenant limitlarini olish.
 */
export async function getTenantLimits(
  tenantId: string
): Promise<TenantLimits> {
  const { data } = await mainHttp.get<
    TenantLimits | TenantLimitsApiResponse
  >(
    ENDPOINTS.subscriptions.admin.tenants.limits(
      tenantId
    )
  );

  return normalizeTenantLimits(data);
}

/**
 * Tenant limitlarini yangilash.
 */
export async function updateTenantLimits(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<TenantLimits> {
  const { data } = await mainHttp.put<
    TenantLimits | TenantLimitsApiResponse
  >(
    ENDPOINTS.subscriptions.admin.tenants.limits(
      tenantId
    ),
    payload
  );

  return normalizeTenantLimits(data);
}

/* =====================================================
 * SUBSCRIPTION PLANS
 * ===================================================== */

/**
 * GET /api/dental/subscriptions/admin/plans
 * endpointidagi bitta tarif.
 *
 * Backend massivni to‘g‘ridan-to‘g‘ri qaytaradi.
 * Tarif identifikatori: planType.
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

  [key: string]: unknown;
}

/**
 * Tariflar ro‘yxatini olish.
 */
export async function getPlans(): Promise<
  SubscriptionPlan[]
> {
  const { data } =
    await mainHttp.get<SubscriptionPlan[]>(
      ENDPOINTS.subscriptions.admin.plans.list
    );

  return Array.isArray(data) ? data : [];
}

/**
 * Bitta tarifni olish.
 */
export async function getPlan(
  planType: string
): Promise<SubscriptionPlan> {
  const { data } =
    await mainHttp.get<SubscriptionPlan>(
      ENDPOINTS.subscriptions.admin.plans.byCode(
        planType
      )
    );

  return data;
}

/* =====================================================
 * ACTIVATE SUBSCRIPTION
 * ===================================================== */

export interface ActivateSubscriptionPayload {
  tenantId: string;
  planType: string;

  [key: string]: unknown;
}

/**
 * Tenant subscriptionini faollashtirish.
 */
export async function activateSubscription(
  payload: ActivateSubscriptionPayload
): Promise<unknown> {
  const { data } = await mainHttp.post(
    ENDPOINTS.subscriptions.activate,
    payload
  );

  return data;
}