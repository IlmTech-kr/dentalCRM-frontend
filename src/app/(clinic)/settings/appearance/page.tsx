"use client";

import { useTranslations } from "next-intl";
import { Bell, Check, LayoutDashboard, Pipette, RotateCcw } from "lucide-react";

import { useUiStore } from "@/src/store/ui.store";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { ACCENT_PRESETS, DEFAULT_ACCENT_COLOR } from "@/src/lib/theme/accentColor";

export default function AppearancePage() {
  const t = useTranslations("settings.appearance");
  const toast = useToast();

  const accentColor = useUiStore((state) => state.accentColor);
  const setAccentColor = useUiStore((state) => state.setAccentColor);

  function applyColor(color: string) {
    setAccentColor(color);
    toast.success(t("toast.applied"));
  }

  function resetToDefault() {
    setAccentColor(DEFAULT_ACCENT_COLOR);
    toast.success(t("toast.reset"));
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("page.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("page.subtitle")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Color picker card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
          {/* Presets */}
          <h2 className="text-sm font-black text-slate-900">{t("presets.title")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("presets.subtitle")}</p>

          <div className="mt-5 grid grid-cols-4 gap-4 sm:grid-cols-8">
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = accentColor.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => applyColor(preset.value)}
                  title={preset.name}
                  aria-label={preset.name}
                  aria-pressed={isSelected}
                  className="group flex flex-col items-center gap-2"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-2 ring-white transition duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg"
                    style={{
                      backgroundColor: preset.value,
                      boxShadow: isSelected
                        ? `0 0 0 2px white, 0 0 0 4px ${preset.value}, 0 8px 16px -4px ${preset.value}66`
                        : undefined,
                    }}
                  >
                    {isSelected && <Check size={18} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="my-7 border-t border-slate-100" />

          {/* Custom picker */}
          <h2 className="text-sm font-black text-slate-900">{t("custom.title")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("custom.subtitle")}</p>

          <div className="mt-5 flex items-center gap-4">
            <label
              className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-lg ring-4 ring-white transition hover:scale-105"
              style={{
                background: `conic-gradient(from 180deg, #f43f5e, #f59e0b, #10b981, #0ea5e9, #6366f1, #f43f5e)`,
              }}
            >
              <span
                className="absolute inset-1.5 rounded-full shadow-inner"
                style={{ backgroundColor: accentColor }}
              />
              <Pipette size={18} className="relative text-white drop-shadow" />
              <input
                type="color"
                value={accentColor}
                onChange={(e) => applyColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            <button
              type="button"
              onClick={resetToDefault}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
            >
              <RotateCcw size={14} />
              {t("custom.resetButton")}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
            <div
              className="flex items-center gap-2.5 px-4 py-3.5 transition-colors duration-300"
              style={{ backgroundColor: accentColor }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20">
                <LayoutDashboard size={13} className="text-white" />
              </span>
              <span className="text-xs font-black text-white">{t("preview.title")}</span>
            </div>

            <div className="space-y-3 bg-slate-50 p-4">
              <div
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-colors duration-300"
                style={{ backgroundColor: accentColor }}
              >
                <LayoutDashboard size={14} />
                {t("preview.menuItem")}
              </div>

              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-300">
                <Bell size={14} />
                <span className="h-2 w-16 rounded-full bg-slate-200" />
              </div>

              <button
                type="button"
                tabIndex={-1}
                className="w-full rounded-xl py-2.5 text-xs font-black text-white shadow-sm transition-colors duration-300"
                style={{ backgroundColor: accentColor }}
              >
                {t("preview.button")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
