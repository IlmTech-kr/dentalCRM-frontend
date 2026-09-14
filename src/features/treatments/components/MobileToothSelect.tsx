"use client";

import { useTranslations } from "next-intl";

import type { ToothItem, ToothMap } from "@/src/types/dental-chart.types";
import { LOWER_TEETH, UPPER_TEETH, getToothStatus } from "./Dental3DChart";

interface MobileToothSelectProps {
  selectedTooth: string;
  toothMap: ToothMap;
  onSelectTooth: (toothNumber: string) => void;
}

const STATUS_FILL: Record<string, string> = {
  missing: "#fee2e2",
  diagnosis: "#ffedd5",
  treated: "#d1fae5",
  clean: "#ffffff",
};

const STATUS_STROKE: Record<string, string> = {
  missing: "#f87171",
  diagnosis: "#fb923c",
  treated: "#34d399",
  clean: "#cbd5e1",
};

const STATUS_TEXT: Record<string, string> = {
  missing: "#b91c1c",
  diagnosis: "#c2410c",
  treated: "#047857",
  clean: "#334155",
};

const STATUS_DOT: Record<string, string> = {
  missing: "bg-red-500",
  diagnosis: "bg-orange-500",
  treated: "bg-emerald-500",
};

const TOOTH_PATH =
  "M12 2c-1.1 0-2 .5-2.5 1.3C9 2.5 8.1 2 7 2 4.8 2 3 4 3 6.8c0 2 .7 3.9 1.3 5.6.5 1.5 1 2.9 1.2 4.3.2 1.6.7 3.3 2.5 3.3s2.3-1.7 2.5-3.3c.1-.7.2-1.4.5-2.1.3.7.4 1.4.5 2.1.2 1.6.7 3.3 2.5 3.3s2.3-1.7 2.5-3.3c.2-1.4.7-2.8 1.2-4.3C20.3 10.7 21 8.8 21 6.8 21 4 19.2 2 17 2c-1.1 0-2 .5-2.5 1.3C14 2.5 13.1 2 12 2z";

function ToothChip({
  tooth,
  selected,
  item,
  onClick,
}: {
  tooth: string;
  selected: boolean;
  item?: ToothItem;
  onClick: () => void;
}) {
  const status = getToothStatus(item);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex h-12 w-11 shrink-0 items-center justify-center
        transition-all
        ${selected ? "z-10 scale-110" : "active:scale-95"}
      `}
    >
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full drop-shadow-sm"
      >
        <path
          d={TOOTH_PATH}
          fill={selected ? "var(--primary-blue)" : STATUS_FILL[status]}
          stroke={selected ? "var(--primary-blue)" : STATUS_STROKE[status]}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>

      <span
        className="relative text-[11px] font-black leading-none"
        style={{ color: selected ? "#ffffff" : STATUS_TEXT[status] }}
      >
        {tooth}
      </span>

      {status !== "clean" && !selected ? (
        <span
          className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white ${STATUS_DOT[status]}`}
        />
      ) : null}
    </button>
  );
}

function JawRow({
  label,
  teeth,
  selectedTooth,
  toothMap,
  onSelectTooth,
}: {
  label: string;
  teeth: string[];
  selectedTooth: string;
  toothMap: ToothMap;
  onSelectTooth: (toothNumber: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {teeth.map((tooth) => (
          <ToothChip
            key={tooth}
            tooth={tooth}
            selected={selectedTooth === tooth}
            item={toothMap[tooth]}
            onClick={() => onSelectTooth(tooth)}
          />
        ))}
      </div>
    </div>
  );
}

export function MobileToothSelect({
  selectedTooth,
  toothMap,
  onSelectTooth,
}: MobileToothSelectProps) {
  const t = useTranslations("treatments");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-900">
          {t("toothSelect.title")}
        </h2>

        <p className="text-xs text-slate-500">{t("toothSelect.subtitle")}</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
          {t("dental3DChart.diagnosisTag")}
        </span>

        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
          {t("dental3DChart.treatedTag")}
        </span>

        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-700">
          {t("dental3DChart.missingTag")}
        </span>
      </div>

      <div className="space-y-4">
        <JawRow
          label={t("toothSelect.upperJaw")}
          teeth={UPPER_TEETH}
          selectedTooth={selectedTooth}
          toothMap={toothMap}
          onSelectTooth={onSelectTooth}
        />

        <JawRow
          label={t("toothSelect.lowerJaw")}
          teeth={LOWER_TEETH}
          selectedTooth={selectedTooth}
          toothMap={toothMap}
          onSelectTooth={onSelectTooth}
        />
      </div>
    </div>
  );
}
