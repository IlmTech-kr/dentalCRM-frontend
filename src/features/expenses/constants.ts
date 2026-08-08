import type { Currency, ExpenseStatus } from "./types";

/** Hozircha faqat UZS tasdiqlangan (bkz. types.ts izohi). */
export const CURRENCIES: Currency[] = ["UZS"];

/** Filtr/select uchun — "VOIDED" alohida ko'rsatilmaydi, VOID bilan bir xil ma'noda. */
export const EXPENSE_STATUSES: ExpenseStatus[] = ["PENDING", "PAID", "VOID"];

export const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

export const DEFAULT_PAGE_SIZE = 20;
