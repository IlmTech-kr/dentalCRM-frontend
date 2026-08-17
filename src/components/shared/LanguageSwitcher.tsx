"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { useLocaleStore } from "@/src/store/locale.store";
import { SUPPORTED_LOCALES, type Locale } from "@/src/lib/i18n/storage";

const LOCALE_LABELS: Record<Locale, { short: string; full: string; flag: string }> = {
  uz: { short: "UZ", full: "O'zbekcha", flag: "🇺🇿" },
  ru: { short: "RU", full: "Русский", flag: "🇷🇺" },
  en: { short: "EN", full: "English", flag: "🇬🇧" },
};

interface LanguageSwitcherProps {
  variant?: "default" | "compact";
  /** "accent" — colored pill matching the primary-blue theme, used on the clinic header. */
  tone?: "default" | "accent";
}

export function LanguageSwitcher({
  variant = "default",
  tone = "default",
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  function handleSelect(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const isAccent = tone === "accent";

  return (
    <div ref={containerRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={
          isAccent
            ? "flex h-10 items-center gap-2 rounded-2xl border border-primary-blue/20 bg-primary-blue/10 px-3 backdrop-blur-sm transition hover:scale-105 hover:bg-primary-blue/20 active:scale-95 sm:h-11"
            : "flex h-11 items-center gap-2 rounded-2xl border border-border-color bg-white px-3 transition hover:bg-slate-50"
        }
      >
        <span className="text-base leading-none">{LOCALE_LABELS[locale].flag}</span>

        {variant === "default" && (
          <span
            className={`text-sm font-semibold ${
              isAccent ? "text-black" : "text-slate-700"
            }`}
          >
            {LOCALE_LABELS[locale].short}
          </span>
        )}

        <ChevronDown
          size={14}
          className={`transition ${isAccent ? "text-black/60" : "text-slate-400"} ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-44 overflow-hidden rounded-2xl border border-border-color bg-white shadow-lg">
          <div className="space-y-1 p-2">
            {SUPPORTED_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleSelect(code)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{LOCALE_LABELS[code].flag}</span>
                  {LOCALE_LABELS[code].full}
                </span>

                {code === locale && (
                  <Check size={16} className="text-primary-blue" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
