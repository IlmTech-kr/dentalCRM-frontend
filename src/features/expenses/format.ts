import type { Currency } from "./types";

/** 3 000 000 UZS ko'rinishida — Expenses ekranlarining uchalasida ham shu ishlatiladi. */
export function formatExpenseMoney(amount?: number | null, currency?: Currency): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "—";
  const formatted = new Intl.NumberFormat("uz-UZ").format(Number(amount));
  return currency ? `${formatted} ${currency}` : formatted;
}
