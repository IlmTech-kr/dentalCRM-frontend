"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Butun ilova bo'ylab ishlatiladigan vaqt tanlash komponenti — brauzer
 * native `<input type="time">` o'rniga. `value`/`onChange` shakli native
 * input bilan bir xil ("HH:mm" satr) — mavjud state/handlerlarga
 * o'zgarishsiz almashtirish mumkin.
 *
 * Soat va daqiqa alohida-alohida, to'g'ridan-to'g'ri (raqamlarni yozib
 * yoki yon tugmalar bilan) tanlanadi — oldindan belgilangan ro'yxatdan
 * (masalan har 15 daqiqada) emas, foydalanuvchi istagan aniq vaqtni
 * o'zi kiritadi.
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function clampWrap(n: number, max: number): number {
  return ((n % max) + max) % max;
}

function parseHM(value?: string | null): { h: number; m: number } | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{1,2})/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function formatHM(h: number, m: number): string {
  return `${pad2(h)}:${pad2(m)}`;
}

export interface TimeInputProps {
  /** "HH:mm" yoki bo'sh satr. */
  value: string;
  onChange: (value: string) => void;
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

export function TimeInput({
  value,
  onChange,
  placeholder,
  disabled,
  autoFocus,
  className,
  id,
  "aria-label": ariaLabel,
}: TimeInputProps) {
  const t = useTranslations("common.datePicker");

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const [style, setStyle] = useState<{ top: number; left: number } | null>(null);

  const parsed = parseHM(value);

  // Popover ochiq bo'lganda soat/daqiqa mustaqil holat sifatida tutiladi —
  // shunda foydalanuvchi yozayotganda (masalan bitta xonani kiritganda)
  // tashqi `value` bilan qayta-qayta sinxronlanib, kursor/qiymatni
  // buzmaydi. Yopilganda yana tashqi `value`dan o'qiladi.
  const [hour, setHour] = useState(() => parsed?.h ?? 0);
  const [minute, setMinute] = useState(() => parsed?.m ?? 0);

  // Popover ochilganda joriy tashqi qiymatga qayta sinxronlanadi — effect
  // emas, render vaqtida (MoneyInput.tsx dagi syncedValue pattern bilan
  // bir xil), cascading render'dan qochish uchun.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setHour(parsed?.h ?? 0);
    setMinute(parsed?.m ?? 0);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  useLayoutEffect(() => {
    if (!open) return;

    function reposition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const popoverHeight = popoverRef.current?.offsetHeight ?? 180;
      const popoverWidth = popoverRef.current?.offsetWidth ?? 220;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < popoverHeight + 12 && rect.top > popoverHeight + 12;

      const top = openUpward ? rect.top - popoverHeight - 8 : rect.bottom + 8;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - popoverWidth - 8);

      setStyle({ top, left });
    }

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    // requestAnimationFrame — trigger tugmani bosish hodisasi to'liq
    // tugagunga qadar kutadi (aks holda ba'zi hollarda fokus qayta
    // tugmaga qaytib ketishi mumkin).
    const raf = requestAnimationFrame(() => {
      hourInputRef.current?.focus();
      hourInputRef.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  function commit(h: number, m: number) {
    setHour(h);
    setMinute(m);
    onChange(formatHM(h, m));
  }

  function handleHourInput(raw: string) {
    // Fokus bo'lganda butun matn tanlanadi (select all), shuning uchun
    // birinchi raqam eskisini almashtiradi; keyingi raqam esa oxiriga
    // qo'shiladi ("0"→"05" keyin "5"+"2"→"052" → oxirgi 2ta "52") — shu
    // sababli OXIRGI 2 ta raqam olinadi, birinchisi emas.
    const digits = raw.replace(/\D/g, "").slice(-2);
    const n = digits === "" ? 0 : Math.min(23, parseInt(digits, 10));
    commit(n, minute);
  }

  function handleMinuteInput(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(-2);
    const n = digits === "" ? 0 : Math.min(59, parseInt(digits, 10));
    commit(hour, n);
  }

  function handleSpinKeyDown(e: KeyboardEvent<HTMLInputElement>, field: "hour" | "minute") {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const delta = e.key === "ArrowUp" ? 1 : -1;
    if (field === "hour") {
      commit(clampWrap(hour + delta, 24), minute);
    } else {
      commit(hour, clampWrap(minute + delta, 60));
    }
  }

  const displayText = parsed ? formatHM(parsed.h, parsed.m) : placeholder ?? t("selectTime");

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
        <Clock size={16} className="shrink-0 text-slate-400" />
        <span className={parsed ? "flex-1 truncate tabular-nums" : "flex-1 truncate text-slate-400"}>{displayText}</span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />
            <div
              ref={popoverRef}
              style={style ? { top: style.top, left: style.left } : { visibility: "hidden" }}
              className="fixed z-[100] w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10"
            >
              <div className="flex items-center justify-between pb-3">
                <span className="whitespace-nowrap text-xs font-black uppercase text-slate-400">{t("selectTime")}</span>
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {t("clear")}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                {/* Soat */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => commit(clampWrap(hour + 1, 24), minute)}
                    className="flex h-6 w-10 items-center justify-center rounded-t-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Increase hour"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <input
                    ref={hourInputRef}
                    type="text"
                    inputMode="numeric"
                    value={pad2(hour)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleHourInput(e.target.value)}
                    onKeyDown={(e) => handleSpinKeyDown(e, "hour")}
                    aria-label="Hour"
                    className="h-12 w-14 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-2xl font-black tabular-nums text-slate-900 outline-none transition focus:border-primary-blue focus:bg-white"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => commit(clampWrap(hour - 1, 24), minute)}
                    className="flex h-6 w-10 items-center justify-center rounded-b-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Decrease hour"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                <span className="mb-8 text-2xl font-black text-slate-300">:</span>

                {/* Daqiqa */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => commit(hour, clampWrap(minute + 1, 60))}
                    className="flex h-6 w-10 items-center justify-center rounded-t-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Increase minute"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pad2(minute)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleMinuteInput(e.target.value)}
                    onKeyDown={(e) => handleSpinKeyDown(e, "minute")}
                    aria-label="Minute"
                    className="h-12 w-14 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-2xl font-black tabular-nums text-slate-900 outline-none transition focus:border-primary-blue focus:bg-white"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => commit(hour, clampWrap(minute - 1, 60))}
                    className="flex h-6 w-10 items-center justify-center rounded-b-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Decrease minute"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    commit(now.getHours(), now.getMinutes());
                  }}
                  className="rounded-lg px-2 py-1.5 text-xs font-bold text-primary-blue transition hover:bg-primary-blue/5"
                >
                  {t("now")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-primary-blue px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary-blue-dark"
                >
                  {t("done")}
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
