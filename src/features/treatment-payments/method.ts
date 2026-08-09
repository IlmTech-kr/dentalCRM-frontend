import type { PaymentMethod } from "./types";

const KNOWN_METHOD_KEYS = new Set(["CARD", "CASH"]);

/**
 * method ochiq `| string` — backend to'liq enum tasdiqlanmagan (ochiq
 * savol). Noma'lum qiymat uchun t() chaqirilmaydi (aks holda
 * MISSING_MESSAGE butun qatorni yiqitib qo'yadi) — xom qiymat ko'rsatiladi.
 */
export function getMethodLabel(t: (key: string) => string, method: PaymentMethod): string {
  const key = method.toUpperCase();
  return KNOWN_METHOD_KEYS.has(key) ? t(`method.${key}`) : method;
}
