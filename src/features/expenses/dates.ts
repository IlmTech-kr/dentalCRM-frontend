/**
 * appointments/page.tsx'dagi getTodayDate/normalizeDateForInput bilan bir
 * xil — API doim "YYYY-MM-DD" satr kutadi, Date obyekt yoki lokalizatsiya
 * qilingan matn emas.
 */

export function todayYMD(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Filtrsiz holatda (masalan sahifa birinchi marta ochilganda) summary/list
 * so'rovlariga cheksiz sana oralig'i yubormaslik uchun — joriy oyning
 * boshi standart "from" qiymati sifatida ishlatiladi.
 */
export function startOfMonthYMD(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function normalizeDateForInput(date?: string | Date | null): string {
  if (!date) return "";
  if (date instanceof Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  const value = String(date).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }
  return value;
}

export function formatDisplayDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}
