/**
 * File: src/features/subscriptions/services/subscription.service.ts
 */

import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CurrentSubscription,
  SubscriptionPlan,
} from "@/src/types/subscription.types";

/**
 * Current plan API response (flat object):
 * {
 *   tenantId, currentPlan, subscriptionStatus,
 *   startDate, endDate, monthlyPrice, planDurationMonths,
 *   maxDoctors, maxStaff, storageLimitBytes, currentStorageBytes,
 *   remainingStorageBytes, smsBalance, includedSmsCount, ...
 * }
 */
function normalizeCurrentSubscription(data: any): CurrentSubscription | null {
  if (!data) return null;

  // Unwrap agar nested bo'lsa
  const raw =
    data?.tenantId ? data :
    data?.data?.tenantId ? data.data :
    data?.subscription?.tenantId ? data.subscription :
    data?.currentSubscription ? data.currentSubscription :
    data?.current ? data.current :
    data;

  if (!raw || typeof raw !== "object") return null;

  return raw as CurrentSubscription;
}

/**
 * Plans API response (array):
 * [{ planType, monthlyPrice, durationMonths, maxDoctors, maxStaff,
 *    storageLimitBytes, includedSmsCount, active }]
 */
function normalizePlansResponse(data: any): SubscriptionPlan[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.plans)) return data.plans;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.data?.plans)) return data.data.plans;
  return [];
}

export async function getCurrentPlan(): Promise<CurrentSubscription | null> {
  try {
    const response = await tenantHttp().get(ENDPOINTS.subscriptions.current);
    return normalizeCurrentSubscription(response.data);
  } catch (error: any) {
    if (error?.status === 404 || error?.response?.status === 404) return null;
    if (process.env.NODE_ENV === "development") {
      console.warn("[Subscription] getCurrentPlan failed:", getApiErrorMessage(error));
    }
    throw error;
  }
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await tenantHttp().get(ENDPOINTS.subscriptions.plans);
    return normalizePlansResponse(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Subscription] getPlans failed:", getApiErrorMessage(error));
    }
    throw error;
  }
}

export async function cancelPlan(): Promise<void> {
  try {
    await tenantHttp().post(ENDPOINTS.subscriptions.cancel);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Subscription] cancelPlan failed:", getApiErrorMessage(error));
    }
    throw error;
  }
}