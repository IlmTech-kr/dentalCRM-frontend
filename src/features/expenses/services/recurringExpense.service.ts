import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  RecurringExpense,
  RecurringExpensesResult,
  RecurringExpenseTotalByCurrency,
  CreateRecurringExpenseDto,
  UpdateRecurringExpenseDto,
} from "../types";

/**
 * Spec bo'yicha GET /recurring-expenses uchun page/limit param yo'q —
 * to'liq ro'yxat sifatida qaraladi (getPlans/getDoctors kabi). Javob
 * shakli tasdiqlanmagan, shu sabab bir nechta variant sinaladi.
 */
function normalizeRecurringExpensesResponse(responseData: unknown): RecurringExpensesResult {
  if (Array.isArray(responseData)) return { items: responseData, totalAmountsByCurrency: [] };

  const data = responseData as Record<string, unknown> | null | undefined;
  const totalAmountsByCurrency = Array.isArray(data?.totalAmountsByCurrency)
    ? (data.totalAmountsByCurrency as RecurringExpenseTotalByCurrency[])
    : [];

  if (Array.isArray(data?.recurringExpenses)) {
    return { items: data.recurringExpenses as RecurringExpense[], totalAmountsByCurrency };
  }
  if (Array.isArray(data?.data)) return { items: data.data as RecurringExpense[], totalAmountsByCurrency };
  if (Array.isArray(data?.content)) return { items: data.content as RecurringExpense[], totalAmountsByCurrency };
  if (Array.isArray(data?.items)) return { items: data.items as RecurringExpense[], totalAmountsByCurrency };

  return { items: [], totalAmountsByCurrency };
}

/**
 * GET /api/dental/recurring-expenses
 */
export async function getRecurringExpenses(): Promise<RecurringExpensesResult> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.recurringExpenses.list);
    return normalizeRecurringExpensesResponse(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RecurringExpense Service] getRecurringExpenses failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load recurring expenses"));
  }
}

/**
 * POST /api/dental/recurring-expenses
 */
export async function createRecurringExpense(
  payload: CreateRecurringExpenseDto
): Promise<RecurringExpense> {
  try {
    const http = tenantHttp();
    const response = await http.post(ENDPOINTS.recurringExpenses.create, payload);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RecurringExpense Service] createRecurringExpense failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to create recurring expense"));
  }
}

/**
 * PUT /api/dental/recurring-expenses/:id
 */
export async function updateRecurringExpense(
  payload: UpdateRecurringExpenseDto
): Promise<RecurringExpense> {
  try {
    const { id, ...body } = payload;
    const http = tenantHttp();
    const response = await http.put(ENDPOINTS.recurringExpenses.update(id), body);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RecurringExpense Service] updateRecurringExpense failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to update recurring expense"));
  }
}

/**
 * POST /api/dental/recurring-expenses/:id/deactivate (body yo'q)
 */
export async function deactivateRecurringExpense(id: string): Promise<RecurringExpense> {
  try {
    const http = tenantHttp();
    const response = await http.post(ENDPOINTS.recurringExpenses.deactivate(id));
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RecurringExpense Service] deactivateRecurringExpense failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to deactivate recurring expense"));
  }
}
