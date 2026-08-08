import type { ExpenseStatus } from "./types";

const KNOWN_STATUS_KEYS = new Set(["PENDING", "PAID", "VOID", "VOIDED"]);

export function isVoided(status: ExpenseStatus): boolean {
  return status.toUpperCase().startsWith("VOID");
}

/**
 * status ochiq `| string` — backend kutilmagan qiymat qaytarsa, t() ni
 * chaqirmasdan xom qiymatni ko'rsatamiz (aks holda MISSING_MESSAGE butun
 * qatorni yiqitib qo'yadi, xuddi shu loyihada avval tuzatilgan
 * revenue/newBadge xatolari kabi).
 */
export function getStatusLabel(t: (key: string) => string, status: ExpenseStatus): string {
  const key = status.toUpperCase();
  return KNOWN_STATUS_KEYS.has(key) ? t(`status.${key}`) : status;
}

export function getStatusStyle(status: ExpenseStatus): { bg: string; color: string } {
  if (status === "PAID") return { bg: "#dcfce7", color: "#15803d" };
  if (isVoided(status)) return { bg: "#f1f5f9", color: "#64748b" };
  return { bg: "#fef3c7", color: "#b45309" }; // PENDING (default)
}
