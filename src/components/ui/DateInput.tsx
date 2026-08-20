"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleStore } from "@/src/store/locale.store";

/**
 * Butun ilova bo'ylab ishlatiladigan sana tanlash komponenti — brauzer
 * native `<input type="date">` o'rniga, chunki native picker har xil OS/
 * brauzerda boshqacha (va ko'pincha xunuk) ko'rinadi. `value`/`onChange`
 * shakli native input bilan bir xil ("YYYY-MM-DD" satr) — shuning uchun
 * mavjud state/handlerlarga o'zgarishsiz almashtirish mumkin.
 */

/**
 * Oy/hafta kuni nomlari qo'lda beriladi — `Intl.DateTimeFormat` "uz"
 * lokali uchun ba'zi brauzerlarda to'liq ICU ma'lumoti yo'q va oy nomi
 * o'rniga "M08" kabi xom pattern qaytaradi (Node'da to'g'ri ishlaydi,
 * lekin Chromium'da tekshirilganda buzilib chiqdi) — shuning uchun
 * ilovaning boshqa joylarida qanday tarjima fayllari ishlatilsa, shu
 * yerda ham runtime Intl'ga tayanmasdan qat'iy jadval ishlatiladi.
 */
const MONTHS_LONG: Record<string, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
};

const MONTHS_SHORT: Record<string, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  uz: ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"],
};

/** Dushanba-boshlanuvchi — buildMonthGrid() bilan bir xil tartib. */
const WEEKDAYS_SHORT: Record<string, string[]> = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  uz: ["Du", "Se", "Chor", "Pay", "Ju", "Sha", "Ya"],
};

function monthsLong(locale: string): string[] {
  return MONTHS_LONG[locale] ?? MONTHS_LONG.en;
}

function monthsShort(locale: string): string[] {
  return MONTHS_SHORT[locale] ?? MONTHS_SHORT.en;
}

function weekdaysShort(locale: string): string[] {
  return WEEKDAYS_SHORT[locale] ?? WEEKDAYS_SHORT.en;
}

function formatDisplayDate(date: Date, locale: string): string {
  return `${pad2(date.getDate())} ${monthsShort(locale)[date.getMonth()]} ${date.getFullYear()}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** "YYYY-MM-DD" ni lokal vaqt zonasida (UTC siljishsiz) Date'ga aylantiradi. */
function parseYMD(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const YEARS_PER_PAGE = 12;

/** Dushanba-boshlanuvchi hafta kunlari qatori — oy panjarasi shu bilan quriladi. */
function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  // JS: 0=Yakshanba..6=Shanba → dushanba-boshlanuvchiga o'giramiz.
  const leadingOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - leadingOffset);

  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

export interface DateInputProps {
  /** "YYYY-MM-DD" yoki bo'sh satr. */
  value: string;
  onChange: (value: string) => void;
  /** "YYYY-MM-DD" — shu sanadan oldingi kunlar tanlab bo'lmaydi. */
  min?: string;
  /** "YYYY-MM-DD" — shu sanadan keyingi kunlar tanlab bo'lmaydi. */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Trigger tugmaning to'liq className'i — berilmasa standart uslub ishlatiladi. */
  className?: string;
  id?: string;
  "aria-label"?: string;
}

const DEFAULT_TRIGGER_CLASS =
  "flex w-full items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export function DateInput({
  value,
  onChange,
  min,
  max,
  placeholder,
  disabled,
  autoFocus,
  className,
  id,
  "aria-label": ariaLabel,
}: DateInputProps) {
  const locale = useLocaleStore((s) => s.locale);
  const t = useTranslations("common.datePicker");

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ top: number; left: number; width: number } | null>(null);

  const selected = parseYMD(value);
  const minDate = parseYMD(min);
  const maxDate = parseYMD(max);

  const [viewYear, setViewYear] = useState(() => (selected ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected ?? new Date()).getMonth());

  // "days" — kunlar panjarasi, "years" — yil tezkor tanlagichi (oy o'qini
  // 1 martada bosib o'zgartirish o'rniga, masalan tug'ilgan sanadagi kabi
  // o'nlab yil orqaga sakrash uchun).
  const [calendarView, setCalendarView] = useState<"days" | "years">("days");
  const [yearGridStart, setYearGridStart] = useState(() => Math.floor(viewYear / YEARS_PER_PAGE) * YEARS_PER_PAGE);

  // Popover ochilganda, kalendar joriy tanlangan (yoki bugungi) oyga qayta
  // o'rnatiladi — effect emas, render vaqtida (MoneyInput.tsx dagi
  // syncedValue pattern bilan bir xil), cascading render'dan qochish uchun.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    const base = selected ?? new Date();
    if (base.getFullYear() !== viewYear || base.getMonth() !== viewMonth) {
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
    }
    setCalendarView("days");
    setYearGridStart(Math.floor(base.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  useLayoutEffect(() => {
    if (!open) return;

    function reposition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const popoverHeight = popoverRef.current?.offsetHeight ?? 360;
      const popoverWidth = popoverRef.current?.offsetWidth ?? 300;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < popoverHeight + 12 && rect.top > popoverHeight + 12;

      const top = openUpward ? rect.top - popoverHeight - 8 : rect.bottom + 8;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - popoverWidth - 8);

      setStyle({ top, left, width: rect.width });
    }

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, viewYear, viewMonth, calendarView, yearGridStart]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function isDisabledDate(date: Date): boolean {
    if (minDate && startOfDay(date) < startOfDay(minDate)) return true;
    if (maxDate && startOfDay(date) > startOfDay(maxDate)) return true;
    return false;
  }

  function handlePick(date: Date) {
    if (isDisabledDate(date)) return;
    onChange(toYMD(date));
    setOpen(false);
  }

  function goToMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const grid = buildMonthGrid(viewYear, viewMonth);
  const today = new Date();
  const monthLabel = `${monthsLong(locale)[viewMonth]} ${viewYear}`;
  const weekdayLabels = weekdaysShort(locale);

  const displayText = selected ? formatDisplayDate(selected, locale) : placeholder ?? t("selectDate");

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={className ?? DEFAULT_TRIGGER_CLASS}
      >
        <CalendarDays size={16} className="shrink-0 text-slate-400" />
        <span className={selected ? "flex-1 truncate" : "flex-1 truncate text-slate-400"}>{displayText || " "}</span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />
            <div
              ref={popoverRef}
              style={style ? { top: style.top, left: style.left, minWidth: Math.max(style.width, 288) } : { visibility: "hidden" }}
              className="fixed z-[100] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10"
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <button
                  type="button"
                  onClick={() =>
                    calendarView === "days" ? goToMonth(-1) : setYearGridStart((y) => y - YEARS_PER_PAGE)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={calendarView === "days" ? "Previous month" : "Previous years"}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarView((v) => (v === "days" ? "years" : "days"))}
                  className="rounded-lg px-2 py-1 text-sm font-black capitalize text-slate-900 transition hover:bg-slate-100"
                >
                  {calendarView === "days" ? monthLabel : `${yearGridStart} – ${yearGridStart + YEARS_PER_PAGE - 1}`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    calendarView === "days" ? goToMonth(1) : setYearGridStart((y) => y + YEARS_PER_PAGE)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={calendarView === "days" ? "Next month" : "Next years"}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {calendarView === "years" ? (
                <div className="grid grid-cols-3 gap-1 px-1 py-1">
                  {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearGridStart + i).map((y) => {
                    const isSelectedYear = y === viewYear;
                    const isCurrentYear = y === today.getFullYear();
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setViewYear(y);
                          setCalendarView("days");
                        }}
                        className={[
                          "flex h-11 items-center justify-center rounded-xl text-sm font-bold tabular-nums transition",
                          isSelectedYear
                            ? "bg-primary-blue text-white shadow-sm shadow-primary-blue/30"
                            : isCurrentYear
                              ? "text-primary-blue ring-1 ring-inset ring-primary-blue/40"
                              : "text-slate-700 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 px-1">
                    {weekdayLabels.map((label, i) => (
                      <span key={i} className="flex h-7 items-center justify-center text-[11px] font-bold uppercase text-slate-400">
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-1 grid grid-cols-7 gap-1 px-1">
                    {grid.map((date, i) => {
                      const inMonth = date.getMonth() === viewMonth;
                      const isSelected = selected ? isSameDay(date, selected) : false;
                      const isToday = isSameDay(date, today);
                      const disabledDay = isDisabledDate(date);

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={disabledDay}
                          onClick={() => handlePick(date)}
                          className={[
                            "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition",
                            isSelected
                              ? "bg-primary-blue text-white shadow-sm shadow-primary-blue/30"
                              : isToday
                                ? "text-primary-blue ring-1 ring-inset ring-primary-blue/40"
                                : inMonth
                                  ? "text-slate-700 hover:bg-slate-100"
                                  : "text-slate-300 hover:bg-slate-50",
                            disabledDay ? "cursor-not-allowed opacity-30 hover:bg-transparent" : "",
                          ].join(" ")}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 px-1 pt-2">
                    <button
                      type="button"
                      onClick={() => handlePick(new Date())}
                      disabled={isDisabledDate(new Date())}
                      className="rounded-lg px-2 py-1.5 text-xs font-bold text-primary-blue transition hover:bg-primary-blue/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("today")}
                    </button>
                    {value && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange("");
                          setOpen(false);
                        }}
                        className="rounded-lg px-2 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        {t("clear")}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
