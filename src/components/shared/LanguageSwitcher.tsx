"use client";

/**
 * File: src/components/shared/LanguageSwitcher.tsx
 */

import { useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";

import { useLocaleStore } from "@/src/store/locale.store";
import { SUPPORTED_LOCALES, type Locale } from "@/src/lib/i18n/storage";

const LOCALE_LABELS: Record<Locale, { short: string; full: string }> = {
  uz: { short: "UZ", full: "O'zbekcha" },
  ru: { short: "RU", full: "Русский" },
  en: { short: "EN", full: "English" },
};

interface LanguageSwitcherProps {
  variant?: "default" | "compact";
}

export function LanguageSwitcher({
  variant = "default",
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  function handleSelect(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <>
      <div className="relative z-30">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className="flex h-11 items-center gap-2 rounded-2xl border border-border-color bg-white px-3 transition hover:bg-slate-50"
        >
          <Globe size={17} className="text-slate-500" />

          {variant === "default" && (
            <span className="text-sm font-semibold text-slate-700">
              {LOCALE_LABELS[locale].short}
            </span>
          )}

          <ChevronDown
            size={14}
            className={`text-slate-400 transition ${
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
                  <span>{LOCALE_LABELS[code].full}</span>

                  {code === locale && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-20 cursor-default bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
