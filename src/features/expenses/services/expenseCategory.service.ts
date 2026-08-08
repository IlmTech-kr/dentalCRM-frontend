import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import type {
  ExpenseCategory,
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from "../types";

/** API javobi har xil shaklda kelishi mumkin — array qilib olamiz. */
function normalizeCategoriesResponse(responseData: unknown): ExpenseCategory[] {
  if (Array.isArray(responseData)) return responseData;

  const data = responseData as Record<string, unknown> | null | undefined;
  if (Array.isArray(data?.data)) return data.data as ExpenseCategory[];
  if (Array.isArray(data?.content)) return data.content as ExpenseCategory[];
  if (Array.isArray(data?.categories)) return data.categories as ExpenseCategory[];
  if (Array.isArray(data?.items)) return data.items as ExpenseCategory[];

  return [];
}

/**
 * GET /api/dental/expense-categories
 */
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  try {
    const http = tenantHttp();
    const response = await http.get(ENDPOINTS.expenseCategories.list);
    return normalizeCategoriesResponse(response.data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ExpenseCategory Service] getExpenseCategories failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to load expense categories"));
  }
}

/**
 * POST /api/dental/expense-categories
 */
export async function createExpenseCategory(
  payload: CreateExpenseCategoryDto
): Promise<ExpenseCategory> {
  try {
    const http = tenantHttp();
    const response = await http.post(ENDPOINTS.expenseCategories.create, payload);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ExpenseCategory Service] createExpenseCategory failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to create expense category"));
  }
}

/**
 * PUT /api/dental/expense-categories/:id
 */
export async function updateExpenseCategory(
  payload: UpdateExpenseCategoryDto
): Promise<ExpenseCategory> {
  try {
    const { id, ...body } = payload;
    const http = tenantHttp();
    const response = await http.put(ENDPOINTS.expenseCategories.update(id), body);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ExpenseCategory Service] updateExpenseCategory failed:", getApiErrorMessage(error));
    }
    throw new Error(getApiErrorMessage(error, "Failed to update expense category"));
  }
}
