"use client";

import type { ReactNode } from "react";

import { ToothCondition } from "@/src/lib/enums/enums.types";
import type { ToothItem, ToothMap } from "@/src/types/dental-chart.types";

interface Dental3DChartProps {
  selectedTooth: string;
  toothMap: ToothMap;
  onSelectTooth: (toothNumber: string) => void;
}

const UPPER_TEETH = [
  "18",
  "17",
  "16",
  "15",
  "14",
  "13",
  "12",
  "11",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
];

const LOWER_TEETH = [
  "48",
  "47",
  "46",
  "45",
  "44",
  "43",
  "42",
  "41",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
];

type ToothStatus = "clean" | "missing" | "diagnosis" | "treated";

function getToothStatus(item?: ToothItem): ToothStatus {
  if (!item) return "clean";

  if (item.states?.includes(ToothCondition.MISSING)) return "missing";
  if (item.states?.includes(ToothCondition.EXTRACTED)) return "missing";

  if (item.diagnoses?.length) return "diagnosis";
  if (item.states?.length) return "treated";

  return "clean";
}

function getToothColor(item?: ToothItem) {
  const status = getToothStatus(item);

  if (status === "missing") {
    return "from-red-100 via-red-50 to-red-200 border-red-300 text-red-700";
  }

  if (status === "diagnosis") {
    return "from-orange-100 via-white to-orange-200 border-orange-300 text-orange-700";
  }

  if (status === "treated") {
    return "from-emerald-100 via-white to-emerald-200 border-emerald-300 text-emerald-700";
  }

  return "from-white via-slate-50 to-slate-200 border-slate-300 text-slate-700";
}

function getToothSize(index: number, type: "upper" | "lower") {
  const centerDistance = Math.abs(index - 7.5);

  if (centerDistance < 1.5) {
    return type === "upper" ? "h-16 w-9" : "h-14 w-8";
  }

  if (centerDistance < 3.5) {
    return type === "upper" ? "h-14 w-8" : "h-12 w-7";
  }

  if (centerDistance < 5.5) {
    return type === "upper" ? "h-12 w-7" : "h-11 w-7";
  }

  return type === "upper" ? "h-11 w-7" : "h-10 w-6";
}

function getToothRotate(index: number) {
  const value = (index - 7.5) * 2.5;
  return `rotate(${value}deg)`;
}

function ToothButton({
  tooth,
  index,
  type,
  selected,
  item,
  onClick,
}: {
  tooth: string;
  index: number;
  type: "upper" | "lower";
  selected: boolean;
  item?: ToothItem;
  onClick: () => void;
}) {
  const status = getToothStatus(item);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        transform: getToothRotate(index),
      }}
      className={`
        relative flex shrink-0 flex-col items-center justify-center
        ${getToothSize(index, type)}
        rounded-b-[45%] rounded-t-[32%]
        border bg-gradient-to-b
        ${getToothColor(item)}
        shadow-[inset_-3px_-5px_7px_rgba(15,23,42,0.12),inset_3px_3px_7px_rgba(255,255,255,0.9),0_5px_12px_rgba(15,23,42,0.1)]
        transition-all duration-200
        hover:-translate-y-0.5 hover:scale-105
        ${
          selected
            ? "z-20 scale-110 border-blue-500 ring-2 ring-blue-200"
            : "z-10"
        }
      `}
    >
      <span className="absolute left-1.5 top-1.5 h-3 w-1.5 rounded-full bg-white/70 blur-[1px]" />

      <span className="text-[9px] font-black">{tooth}</span>

      {status !== "clean" ? (
        <span
          className={`
            mt-0.5 h-1.5 w-1.5 rounded-full
            ${
              status === "missing"
                ? "bg-red-500"
                : status === "diagnosis"
                  ? "bg-orange-500"
                  : "bg-emerald-500"
            }
          `}
        />
      ) : null}
    </button>
  );
}

function Gum({
  type,
  children,
}: {
  type: "upper" | "lower";
  children: ReactNode;
}) {
  return (
    <div
      className={`
        relative mx-auto flex w-full max-w-3xl justify-center overflow-visible px-3
        ${type === "upper" ? "pb-4 pt-5" : "pb-5 pt-4"}
      `}
    >
      <div
        className={`
          absolute left-1/2 z-0 w-[88%] -translate-x-1/2
          rounded-[50%]
          bg-gradient-to-b from-rose-300 via-rose-400 to-rose-500
          shadow-[inset_0_6px_12px_rgba(255,255,255,0.35),inset_0_-8px_16px_rgba(136,19,55,0.2),0_8px_18px_rgba(190,18,60,0.14)]
          ${
            type === "upper"
              ? "top-0 h-16 rounded-b-[42%]"
              : "bottom-0 h-16 rounded-t-[42%]"
          }
        `}
      />

      <div
        className={`
          relative z-10 flex items-center justify-center gap-0.5 sm:gap-1
          ${type === "upper" ? "mt-7" : "mb-7"}
        `}
      >
        {children}
      </div>
    </div>
  );
}

export function Dental3DChart({
  selectedTooth,
  toothMap,
  onSelectTooth,
}: Dental3DChartProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            3D tish xaritasi
          </h2>

          <p className="text-xs text-slate-500">
            Tishni bosib tanlang, o‘ng paneldan diagnoz va holatni belgilang.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
            Diagnoz
          </span>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            Davolangan
          </span>

          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-700">
            Yo‘q
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-gradient-to-b from-slate-50 to-white p-2">
        <div className="min-w-[560px] space-y-4">
          <Gum type="upper">
            {UPPER_TEETH.map((tooth, index) => (
              <ToothButton
                key={tooth}
                tooth={tooth}
                index={index}
                type="upper"
                selected={selectedTooth === tooth}
                item={toothMap[tooth]}
                onClick={() => onSelectTooth(tooth)}
              />
            ))}
          </Gum>

          <div className="mx-auto flex h-9 w-[72%] items-center justify-center rounded-[50%] border border-slate-100 bg-white shadow-inner">
            <span className="text-[10px] font-semibold text-slate-400">
              Og‘iz bo‘shlig‘i
            </span>
          </div>

          <Gum type="lower">
            {LOWER_TEETH.map((tooth, index) => (
              <ToothButton
                key={tooth}
                tooth={tooth}
                index={index}
                type="lower"
                selected={selectedTooth === tooth}
                item={toothMap[tooth]}
                onClick={() => onSelectTooth(tooth)}
              />
            ))}
          </Gum>
        </div>
      </div>
    </div>
  );
}