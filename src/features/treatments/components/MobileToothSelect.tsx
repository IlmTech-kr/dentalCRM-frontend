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

type ToothType = "incisor" | "canine" | "premolar" | "molar" | "wisdom";

function getToothType(tooth: string): ToothType {
  const position = Number(tooth) % 10;
  if (position <= 2) return "incisor";
  if (position === 3) return "canine";
  if (position <= 5) return "premolar";
  if (position === 8) return "wisdom";
  return "molar";
}

const TOOTH_SHAPES: Record<ToothType, string[]> = {
  // Rounded top, gently tapering down to the neck
  incisor: [
    "M6.5 6C6.5 3.8 8.8 2.6 12 2.6C15.2 2.6 17.5 3.8 17.5 6C17.5 11.5 16.4 21 12 21C7.6 21 6.5 11.5 6.5 6Z",
  ],
  // Single pointed cusp at the top
  canine: [
    "M12 2.2L15.9 6.8C17.1 8.3 17.5 10.3 17.3 12.8C17 16.8 15.1 21 12 21C8.9 21 7 16.8 6.7 12.8C6.5 10.3 6.9 8.3 8.1 6.8Z",
  ],
  // Two cusps with a small valley between them
  premolar: [
    "M6.5 7C6.5 4.5 8 3 9.5 3C10.5 3 11.2 4.4 12 4.4C12.8 4.4 13.5 3 14.5 3C16 3 17.5 4.5 17.5 7C17.5 12.5 16.2 21 12 21C7.8 21 6.5 12.5 6.5 7Z",
  ],
  // Wide crown, two big cusps and a central groove
  molar: [
    "M4.5 8C4.5 5.2 6 3.2 8 3.2C9 2.4 10.2 3.7 12 3.7C13.8 3.7 15 2.4 16 3.2C18 3.2 19.5 5.2 19.5 8C19.5 13.5 17.7 20.6 12 20.6C6.3 20.6 4.5 13.5 4.5 8Z",
  ],
  // Like a molar, slightly smaller and rounder
  wisdom: [
    "M5 8.5C5 5.8 6.4 4 8.2 4C9.1 3.3 10.3 3.4 12 3.4C13.7 3.4 14.9 3.3 15.8 4C17.6 4 19 5.8 19 8.5C19 13 17.4 20 12 20C6.6 20 5 13 5 8.5Z",
  ],
};

// Small highlight arc on the upper-left of the crown
const TOOTH_SHINE = "M7.8 6.2C8.4 4.6 9.8 3.6 11.2 3.4";

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
  const shapes = TOOTH_SHAPES[getToothType(tooth)];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex h-16 w-[58px] shrink-0 items-center justify-center
        transition-all
        ${selected ? "z-10 scale-110" : "active:scale-95"}
      `}
    >
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full drop-shadow-sm"
      >
        {shapes.map((shape, index) => (
          <path
            key={index}
            d={shape}
            fill={selected ? "var(--primary-blue)" : STATUS_FILL[status]}
            stroke={selected ? "var(--primary-blue)" : STATUS_STROKE[status]}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        ))}
        <path
          d={TOOTH_SHINE}
          fill="none"
          stroke={selected ? "rgba(255,255,255,0.85)" : "#ffffff"}
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity={0.75}
        />
      </svg>

      <span
        className="relative text-sm font-black leading-none"
        style={{ color: selected ? "#ffffff" : STATUS_TEXT[status] }}
      >
        {tooth}
      </span>

      {status !== "clean" && !selected ? (
        <span
          className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ring-2 ring-white ${STATUS_DOT[status]}`}
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