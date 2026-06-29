/**
 * File: src/features/payment/services/payment.service.ts
 */

import axios from "axios";
import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CreateCheckoutResponse,
  CreatePaymentOrderDto,
  CreatePaymentOrderResponse,
} from "@/src/types/payment.types";

function extractOrderId(data: CreatePaymentOrderResponse | string): string {
  if (typeof data === "string") return data;

  const orderId =
    data?.orderId || data?.id || data?._id ||
    data?.data?.orderId || data?.data?.id || data?.data?._id;

  if (!orderId) throw new Error("Order ID was not returned from payment endpoint");

  return orderId;
}

function extractCheckoutUrl(data: CreateCheckoutResponse | string): string {
  if (typeof data === "string") return data;

  const url =
    data?.checkoutUrl || data?.paymeUrl || data?.url ||
    data?.data?.checkoutUrl || data?.data?.paymeUrl || data?.data?.url;

  if (!url) throw new Error("Checkout URL was not returned from payment endpoint");

  return url;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const d = error.response?.data as any;
    return d?.message || d?.error || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function createPaymentOrder(payload: CreatePaymentOrderDto): Promise<string> {
  try {
    const response = await tenantHttp().post<CreatePaymentOrderResponse>(
      ENDPOINTS.payment.orders,
      payload
    );
    return extractOrderId(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Payment] createPaymentOrder failed:", getApiErrorMessage(error));
    }
    throw new Error(getErrorMessage(error, "Failed to create payment order"));
  }
}

export async function createPaymentCheckout(orderId: string): Promise<string> {
  try {
    const response = await tenantHttp().post<CreateCheckoutResponse>(
      ENDPOINTS.payment.checkout,
      { orderId }
    );
    return extractCheckoutUrl(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Payment] createPaymentCheckout failed:", getApiErrorMessage(error));
    }
    throw new Error(getErrorMessage(error, "Failed to create checkout URL"));
  }
}

export async function activatePlanPayment(payload: CreatePaymentOrderDto): Promise<string> {
  const orderId = await createPaymentOrder(payload);
  return createPaymentCheckout(orderId);
}