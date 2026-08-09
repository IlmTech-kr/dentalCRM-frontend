/**
 * `paidAt` — sana-vaqt, "YYYY-MM-DDTHH:mm:ss" (timezone qo'shimchasisiz).
 * `toISOString()` ISHLATILMAYDI — u UTC'ga o'girib "Z" qo'shadi va
 * qiymatni siljitib yuboradi (spec ochiq talabi). Shu sabab bu yerdagi
 * barcha funksiyalar `Date` obyektiga umuman murojaat qilmaydi — faqat
 * satr bilan ishlaydi, browser/runtime timezone talqiniga bog'liq bo'lmasin.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Joriy lokal sana-vaqt — "YYYY-MM-DDTHH:mm:ss". */
export function nowDateTime(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** <input type="datetime-local"> "YYYY-MM-DDTHH:mm" kutadi (soniyasiz). */
export function toDateTimeInputValue(value?: string | null): string {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match ? match[1] : value;
}

/** <input> qiymatini ("YYYY-MM-DDTHH:mm") API formatiga o'tkazadi (":ss" qo'shib). */
export function fromDateTimeInputValue(value: string): string {
  if (!value) return value;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
}

/** Ko'rsatish uchun — "08.08.2026 01:00". */
export function formatDateTimeDisplay(value?: string | null): string {
  if (!value) return "—";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return value;
  const [, y, m, d, h, min] = match;
  return `${d}.${m}.${y} ${h}:${min}`;
}
