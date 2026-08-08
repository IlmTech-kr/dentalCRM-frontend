import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  Expense,
  CreateExpenseDto,
  ExpenseListParams,
  ExpenseListResponse,
  ExpenseSummary,
  ExpenseSummaryParams,
  PayExpenseDto,
  VoidExpenseDto,
} from "../types";

/**
 * Pagination konvertining aniq shakli tasdiqlanmagan (spec faqat request
 * paramlarini beradi) — bir nechta mumkin bo'lgan maydon nomini sinab
 * ko'ramiz, superadmin/clinics.admin.service.ts'dagi getClinics() bilan
 * bir xil himoya usuli.
 */
function normalizeExpenseListResponse(
  data: unknown,
  params: ExpenseListParams
): ExpenseListResponse {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: params.page ?? 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    };
  }

  const d = (data ?? {}) as Record<string, unknown>;
  const items = (d.expenses ?? d.items ?? d.content ?? d.data ?? []) as Expense[];
  const page = (d.page as number | undefined) ?? params.page ?? 0;
  const size = (d.size as number | undefined) ?? (d.limit as number | undefined) ?? params.limit ?? items.length;
  const totalElements =
    (d.totalElements as number | undefined) ??
    (d.total as number | undefined) ??
    (d.totalCount as number | undefined) ??
    items.length;
  const totalPages =
    (d.totalPages as number | undefined) ?? (size > 0 ? Math.ceil(totalElements / size) : 0);

  return { items, page, size, totalElements, totalPages };
}

/**
 * Summary javob shakli ham tasdiqlanmagan — mumkin bo'lgan bir nechta
 * maydon nomi sinab ko'riladi. Agar hech biri topilmasa, chaqiruvchi
 * (Expenses sahifasi) ro'yxatning o'zidan hisoblab ko'rsatishga qaytadi.
 */
function normalizeExpenseSummary(data: unknown): ExpenseSummary {
  const d = (data ?? {}) as Record<string, unknown>;

  const totalAmount =
    (d.totalAmount as number | undefined) ??
    (d.total as number | undefined) ??
    (d.amount as number | undefined) ??
    0;

  const totalCount =
    (d.totalCount as number | undefined) ??
    (d.count as number | undefined) ??
    (d.totalTransactionCount as number | undefined) ??
    0;

  return {
    totalAmount,
    totalCount,
    currency: d.currency as string | undefined,
    byStatus: d.byStatus as ExpenseSummary["byStatus"],
  };
}

/**
 * GET /api/dental/expenses
 */
export async function getExpenses(params: ExpenseListParams): Promise<ExpenseListResponse> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.expenses.list(params));
    return normalizeExpenseListResponse(response.data, params);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Expense Service] getExpenses failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load expenses"));
  }
}

/**
 * GET /api/dental/expenses/summary
 */
export async function getExpenseSummary(params: ExpenseSummaryParams): Promise<ExpenseSummary> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.expenses.summary(params));
    return normalizeExpenseSummary(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Expense Service] getExpenseSummary failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load expense summary"));
  }
}

/**
 * POST /api/dental/expenses
 */
export async function createExpense(payload: CreateExpenseDto): Promise<Expense> {
  try {
    const http = tenantHttp();
    const response = await http.post(ENDPOINTS.expenses.create, payload);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Expense Service] createExpense failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to create expense"));
  }
}

/**
 * POST /api/dental/expenses/:id/pay
 */
export async function payExpense(id: string, payload: PayExpenseDto): Promise<Expense> {
  try {
    const http = tenantHttp();
    const response = await http.post(ENDPOINTS.expenses.pay(id), payload);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Expense Service] payExpense failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to mark expense as paid"));
  }
}

/**
 * POST /api/dental/expenses/:id/void
 */
export async function voidExpense(id: string, payload: VoidExpenseDto): Promise<Expense> {
  try {
    const http = tenantHttp();
    const response = await http.post(ENDPOINTS.expenses.void(id), payload);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Expense Service] voidExpense failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to void expense"));
  }
}
