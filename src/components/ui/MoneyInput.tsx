"use client";

import type { ChangeEvent, FocusEvent } from "react";
import { useState } from "react";

/**
 * Pul summasi kiritish uchun input — minglik xonalar "." bilan ajratiladi
 * (masalan "200.000"), o'qishni osonlashtirish uchun. `allowDecimal` bo'lsa
 * kasr qism vergul bilan kiritiladi ("100,50") — nuqta faqat guruhlash
 * uchun, o'nlik ajratkich sifatida ishlatilmaydi.
 */

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function stripToDigitsAndComma(raw: string, allowDecimal: boolean): string {
  let cleaned = raw.replace(allowDecimal ? /[^\d,]/g : /[^\d]/g, "");

  if (allowDecimal) {
    const firstComma = cleaned.indexOf(",");
    if (firstComma !== -1) {
      const intPart = cleaned.slice(0, firstComma);
      const decPart = cleaned.slice(firstComma + 1).replace(/,/g, "").slice(0, 2);
      cleaned = `${intPart},${decPart}`;
    }
  }

  return cleaned;
}

function formatForDisplay(raw: string, allowDecimal: boolean): string {
  const cleaned = stripToDigitsAndComma(raw, allowDecimal);
  if (!allowDecimal) return groupThousands(cleaned);

  const [intPart, decPart] = cleaned.split(",");
  const groupedInt = groupThousands(intPart || "");
  return decPart !== undefined ? `${groupedInt},${decPart}` : groupedInt;
}

function toNumericValue(display: string): number {
  const normalized = display.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatFromNumber(value: number, allowDecimal: boolean): string {
  if (!value) return "";

  if (allowDecimal) {
    const [intStr, decStr] = String(value).split(".");
    const grouped = groupThousands(intStr);
    return decStr ? `${grouped},${decStr.slice(0, 2)}` : grouped;
  }

  return groupThousands(String(Math.round(value)));
}

export function MoneyInput({
  value,
  onChange,
  allowDecimal = false,
  placeholder = "0",
  className,
  autoFocus,
}: {
  value: number;
  onChange: (value: number) => void;
  allowDecimal?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [display, setDisplay] = useState(() => formatFromNumber(value, allowDecimal));
  const [syncedValue, setSyncedValue] = useState(value);

  // Tashqaridan value o'zgarsa (masalan "Narxni tiklash" tugmasi) — displayni qayta formatlash.
  // Effect emas, render vaqtida solishtirish: shu bilan foydalanuvchi terayotgan formatni
  // o'zining onChange orqali kelgan qayta-renderlash buzib qo'ymaydi.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDisplay(formatFromNumber(value, allowDecimal));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const formatted = formatForDisplay(event.target.value, allowDecimal);
    const numeric = toNumericValue(formatted);
    setDisplay(formatted);
    setSyncedValue(numeric);
    onChange(numeric);
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    event.target.select();
  }

  return (
    <input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
      autoFocus={autoFocus}
    />
  );
}
