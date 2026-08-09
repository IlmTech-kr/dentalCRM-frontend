import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  CoursePaymentsResponse,
  CreateTreatmentPaymentDto,
  TreatmentPayment,
  TreatmentPaymentListItem,
  TreatmentPaymentListParams,
  TreatmentPaymentListResponse,
  TreatmentPaymentsSummary,
  TreatmentPaymentsSummaryParams,
  VoidTreatmentPaymentDto,
} from "../types";

/**
 * Global ro'yxat javob konverti `{ payments, total }` — expenses
 * ro'yxatidan farqli, boshqa joyda tasdiqlanmagan shakl. Shu sabab
 * getExpenses() kabi himoyalangan normalizatsiya qilinadi: bir nechta
 * mumkin bo'lgan maydon nomi sinaladi, noto'g'ri taxmin bo'lsa tuzatish
 * faqat shu funksiyada bo'ladi.
 */
function normalizeTreatmentPaymentListResponse(data: unknown): TreatmentPaymentListResponse {
  if (Array.isArray(data)) {
    return { payments: data, total: data.length };
  }

  const d = (data ?? {}) as Record<string, unknown>;
  const payments = (d.payments ?? d.items ?? d.content ?? d.data ?? []) as TreatmentPaymentListItem[];
  const total =
    (d.total as number | undefined) ??
    (d.totalElements as number | undefined) ??
    (d.totalCount as number | undefined) ??
    payments.length;

  return { payments, total };
}

/**
 * POST /api/dental/treatment-courses/:courseId/payments
 */
export async function createTreatmentPayment(
  courseId: string,
  payload: CreateTreatmentPaymentDto
): Promise<TreatmentPayment> {
  try {
    const http = tenantHttp();
    const response = await http.post(ENDPOINTS.dental.treatmentCourses.payments.create(courseId), payload);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TreatmentPayment Service] createTreatmentPayment failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to create payment"));
  }
}

/**
 * GET /api/dental/treatment-courses/:courseId/payments
 */
export async function getCoursePayments(courseId: string): Promise<CoursePaymentsResponse> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.dental.treatmentCourses.payments.list(courseId));
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TreatmentPayment Service] getCoursePayments failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load course payments"));
  }
}

/**
 * POST /api/dental/treatment-courses/:courseId/payments/:paymentId/void
 */
export async function voidTreatmentPayment(
  courseId: string,
  paymentId: string,
  payload: VoidTreatmentPaymentDto
): Promise<TreatmentPayment> {
  try {
    const http = tenantHttp();
    const response = await http.post(
      ENDPOINTS.dental.treatmentCourses.payments.void(courseId, paymentId),
      payload
    );
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TreatmentPayment Service] voidTreatmentPayment failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to void payment"));
  }
}

/**
 * GET /api/dental/treatment-payments
 */
export async function getTreatmentPayments(
  params: TreatmentPaymentListParams
): Promise<TreatmentPaymentListResponse> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.treatmentPayments.list(params));
    return normalizeTreatmentPaymentListResponse(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TreatmentPayment Service] getTreatmentPayments failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load payments"));
  }
}

/**
 * GET /api/dental/treatment-payments/summary
 */
export async function getTreatmentPaymentsSummary(
  params: TreatmentPaymentsSummaryParams
): Promise<TreatmentPaymentsSummary> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.treatmentPayments.summary(params));
    const data = response.data ?? {};
    return {
      fromDate: data.fromDate ?? params.fromDate ?? "",
      toDate: data.toDate ?? params.toDate ?? "",
      currencies: Array.isArray(data.currencies) ? data.currencies : [],
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[TreatmentPayment Service] getTreatmentPaymentsSummary failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load payments summary"));
  }
}
