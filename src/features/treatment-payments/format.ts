import type { Currency } from "./types";

/** "30 USD" ko'rinishida — course panel va global ro'yxatning ikkalasida ham ishlatiladi. */
export function formatPaymentMoney(amount?: number | null, currency?: Currency): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "—";
  const formatted = new Intl.NumberFormat("uz-UZ").format(Number(amount));
  return currency ? `${formatted} ${currency}` : formatted;
}
