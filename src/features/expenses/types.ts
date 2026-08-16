/**
 * Backend javob shakli quyidagi maydonlar bo'yicha tasdiqlanmagan (real
 * so'rov bilan tekshirilmagan) — shu sabab enum'lar `| string` bilan ochiq
 * qoldirilgan va list/summary javoblari xizmat qatlamida himoyalangan
 * (bir nechta mumkin bo'lgan shaklga moslashtiriladi). Noto'g'ri taxmin
 * bo'lsa, tuzatish faqat shu fayl va tegishli service funksiyasida bo'ladi.
 */

export type ExpenseCategoryKind =
  | "TECHNICAL"
  | "SUPPLIES"
  | "OVERHEAD"
  | "OTHER"
  | string;

export interface ExpenseCategory {
  id: string;
  name: string;
  kind: ExpenseCategoryKind;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseCategoryDto {
  name: string;
  kind: ExpenseCategoryKind;
}

export interface UpdateExpenseCategoryDto extends CreateExpenseCategoryDto {
  id: string;
}

/**
 * "VOID" yoki "VOIDED" — aniq qiymat backend bilan tasdiqlanmagan.
 * Voidlanganini tekshirish uchun `status.startsWith("VOID")` ishlatiladi,
 * ikkalasi bilan ham ishlaydi.
 */
export type ExpenseStatus = "PENDING" | "PAID" | "VOID" | "VOIDED" | string;

/** Hozircha faqat UZS tasdiqlangan — boshqa valyutalar backend bilan tekshirilmagan. */
export type Currency = "UZS" | string;

export interface Expense {
  id: string;
  categoryId: string;
  category?: ExpenseCategory;
  amount: number;
  currency: Currency;
  expenseDate: string;
  status: ExpenseStatus;
  payeeName: string;
  description?: string;
  reference?: string;
  paidAt?: string | null;
  voidReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseDto {
  categoryId: string;
  amount: number;
  currency: Currency;
  expenseDate: string;
  status?: ExpenseStatus;
  payeeName: string;
  description?: string;
  reference?: string;
}

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  status?: ExpenseStatus;
  currency?: Currency;
}

export interface ExpenseListResponse {
  items: Expense[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PayExpenseDto {
  paidAt: string;
}

export interface VoidExpenseDto {
  reason: string;
}

/**
 * GET /expenses/summary aniq javob shakli tasdiqlanmagan — spec faqat
 * "totals for a period" deydi. `byStatus` ixtiyoriy: bo'lmasa summary
 * kartalari ro'yxat sahifasidagi joriy natijalardan hisoblanadi.
 */
export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  currency?: Currency;
  byStatus?: Record<string, { amount: number; count: number }>;
}

export interface ExpenseSummaryParams {
  fromDate?: string;
  toDate?: string;
  currency?: Currency;
  status?: ExpenseStatus;
}

export interface RecurringExpense {
  id: string;
  categoryId: string;
  category?: ExpenseCategory;
  amount: number;
  currency: Currency;
  payeeName: string;
  description?: string;
  reference?: string;
  dayOfMonth: number;
  startDate: string;
  endDate?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRecurringExpenseDto {
  categoryId: string;
  amount: number;
  currency: Currency;
  payeeName: string;
  /** Backend tomonidan majburiy (haqiqiy API bilan tekshirilgan). */
  description: string;
  reference?: string;
  dayOfMonth: number;
  startDate: string;
  endDate?: string | null;
  active?: boolean;
}

export interface UpdateRecurringExpenseDto extends CreateRecurringExpenseDto {
  id: string;
}

export interface RecurringExpenseTotalByCurrency {
  currency: Currency;
  totalAmount: number;
}

export interface RecurringExpensesResult {
  items: RecurringExpense[];
  totalAmountsByCurrency: RecurringExpenseTotalByCurrency[];
}
