/**
 * File: src/types/subscription.types.ts
 *
 * API response ga mos keltirildi:
 *
 * Current plan response:
 * { tenantId, currentPlan, subscriptionStatus, startDate, endDate,
 *   monthlyPrice, planDurationMonths, maxDoctors, maxStaff,
 *   storageLimitBytes, currentStorageBytes, remainingStorageBytes,
 *   smsBalance, includedSmsCount, lastActivatedAt, lastPaymentTransactionId }
 *
 * Plans response (array):
 * [{ planType, monthlyPrice, durationMonths, maxDoctors, maxStaff,
 *    storageLimitBytes, includedSmsCount, active }]
 */

export type PlanType = "START" | "PRO" | "ENTERPRISE";

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "CANCELED"
  | "EXPIRED"
  | "SUSPENDED"
  | string;

// ---------------------------------------------------------------------------
// Plans list item (GET /plans)
// ---------------------------------------------------------------------------
export interface SubscriptionPlan {
  // Identity
  id?: string;
  _id?: string;

  // Plan type — API da "planType" field
  planType?: PlanType | string;
  type?: PlanType | string;
  name?: string;
  title?: string;
  description?: string;

  // Pricing — API da "monthlyPrice"
  monthlyPrice?: number;
  price?: number;
  priceMonthly?: number;

  // Limits — API da "maxDoctors", "maxStaff", "storageLimitBytes"
  maxDoctors?: number;
  doctorLimit?: number;

  maxStaff?: number;
  maxPatients?: number;
  patientLimit?: number;

  storageLimitBytes?: number;  // ← asosiy field (bytes)
  maxStorageGb?: number;       // fallback (GB)
  storageGb?: number;

  // Duration
  durationMonths?: number;

  // SMS
  includedSmsCount?: number;

  // Meta
  active?: boolean;
  recommended?: boolean;
  features?: string[];
}

// ---------------------------------------------------------------------------
// Current subscription (GET /subscriptions/current)
// ---------------------------------------------------------------------------
export interface CurrentSubscription {
  // Identity
  id?: string;
  _id?: string;
  tenantId?: string;

  // Plan type — API da "currentPlan" field
  currentPlan?: PlanType | string;
  planType?: PlanType | string;   // fallback

  // Status — API da "subscriptionStatus" field
  subscriptionStatus?: SubscriptionStatus;
  status?: SubscriptionStatus;    // fallback

  // Dates
  startDate?: string;
  endDate?: string;
  trialEndDate?: string;
  nextBillingDate?: string;
  lastActivatedAt?: string;

  // Pricing — API da "monthlyPrice" (to'g'ridan, plan ichida emas)
  monthlyPrice?: number;

  // Duration
  planDurationMonths?: number;

  // Limits
  maxDoctors?: number;
  maxStaff?: number;
  maxPatients?: number;

  // Storage (bytes) — API da "storageLimitBytes", "currentStorageBytes"
  storageLimitBytes?: number;
  currentStorageBytes?: number;
  remainingStorageBytes?: number;

  // SMS
  smsBalance?: number;
  includedSmsCount?: number;

  // Payment
  lastPaymentTransactionId?: string | null;

  // Nested plan (ba'zi API larda bo'ladi)
  plan?: SubscriptionPlan;

  // Usage (ba'zi API larda bo'ladi)
  usedDoctors?: number;
  usedPatients?: number;
  usedStorageGb?: number;
  maxStorageGb?: number;
}