"use client";

import type { ReactNode } from "react";

/**
 * Sof CSS tooltip (JS holatisiz) — icon-only tugmalar uchun (edit/delete/va h.k.).
 * Hover va keyboard-focus'da ko'rinadi. Alohida `group/tooltip` nomi bilan,
 * sahifadagi boshqa `group` klasslari bilan to'qnashmasligi uchun.
 */
export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  const isTop = side === "top";

  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${
          isTop ? "bottom-full mb-2" : "top-full mt-2"
        }`}
      >
        {label}
        <span
          className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
            isTop ? "top-full border-t-slate-900" : "bottom-full border-b-slate-900"
          }`}
        />
      </span>
    </span>
  );
}
