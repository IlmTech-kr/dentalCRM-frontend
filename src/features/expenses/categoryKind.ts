import type { ExpenseCategoryKind } from "./types";

export interface CategoryKindOption {
  value: ExpenseCategoryKind;
  color: string;
  bg: string;
}

export const CATEGORY_KIND_OPTIONS: CategoryKindOption[] = [
  { value: "TECHNICAL", color: "#0ea5e9", bg: "#e0f2fe" },
  { value: "SUPPLIES", color: "#8b5cf6", bg: "#f3e8ff" },
  { value: "OVERHEAD", color: "#f59e0b", bg: "#fef3c7" },
  { value: "OTHER", color: "#64748b", bg: "#f1f5f9" },
];

const FALLBACK_KIND_OPTION = CATEGORY_KIND_OPTIONS[CATEGORY_KIND_OPTIONS.length - 1];

export function getCategoryKindConfig(kind: ExpenseCategoryKind): CategoryKindOption {
  return CATEGORY_KIND_OPTIONS.find((opt) => opt.value === kind) ?? FALLBACK_KIND_OPTION;
}
