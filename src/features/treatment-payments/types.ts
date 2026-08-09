import type { Currency } from "@/src/features/expenses/types";

export type { Currency };

/**
 * Backend'ning to'liq enum ro'yxati tasdiqlanmagan (spec ochiq savol #1) —
 * shu sabab `| string` bilan ochiq qoldirilgan, xuddi ExpenseStatus kabi.
 * Ma'lum qiymatlar: CARD, CASH.
 */
export type PaymentMethod = "CARD" | "CASH" | string;

/**
 * `paidAt`/`voidedAt` — sana-vaqt ("YYYY-MM-DDTHH:mm:ss", timezone
 * qo'shimchasisiz). `fromDate`/`toDate` esa faqat sana ("YYYY-MM-DD").
 * Bu ikkisini araltirib yubormaslik uchun alohida nomlangan.
 */
export interface TreatmentPayment {
  id: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  paidAt: string;
  reference?: string | null;
  note?: string | null;
  voided: boolean;
  voidReason?: string | null;
  voidedAt?: string | null;
  appointmentId?: string | null;
  visitDate?: string | null;
}

/** Global ro'yxatda qo'shimcha (course/patient kontekstidagi) maydonlar. */
export interface TreatmentPaymentListItem extends TreatmentPayment {
  treatmentCourseId: string;
  patientId: string;
  patientName: string;
  courseDiagnosis?: string | null;
}

export interface CreateTreatmentPaymentDto {
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  paidAt: string;
  reference?: string;
  note?: string;
}

export interface VoidTreatmentPaymentDto {
  reason: string;
}

/**
 * GET /treatment-courses/:courseId/payments — bitta so'rov bir vaqtda
 * balans (totalAmount/paidAmount/remainingBalance) va payments[] ro'yxatini
 * qaytaradi. paidAmount/remainingBalance HAR DOIM serverdan olinadi —
 * client tomonda payments[] asosida qayta hisoblanmaydi (voidlangan
 * to'lovlar serverda allaqachon chiqarib tashlangan).
 */
export interface CoursePaymentsResponse {
  treatmentCourseId: string;
  currency: Currency;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  payments: TreatmentPayment[];
}

export interface TreatmentPaymentListParams {
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  voided?: boolean;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface TreatmentPaymentListResponse {
  payments: TreatmentPaymentListItem[];
  total: number;
}

export interface TreatmentPaymentsSummaryParams {
  fromDate?: string;
  toDate?: string;
}

export interface TreatmentPaymentCurrencySummary {
  currency: Currency;
  receivedAmount: number;
  paymentCount: number;
}

export interface TreatmentPaymentsSummary {
  fromDate: string;
  toDate: string;
  currencies: TreatmentPaymentCurrencySummary[];
}
