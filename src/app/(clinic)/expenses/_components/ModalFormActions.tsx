"use client";

import { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";

/** Har bir modal formaning pastki Cancel/Submit qatori — rang variant bo'yicha sozlanadi. */
export function ModalFormActions({
  cancelLabel,
  submitLabel,
  onCancel,
  isSubmitting,
  submitColorClassName = "bg-primary-blue hover:bg-primary-blue-dark",
}: {
  cancelLabel: string;
  submitLabel: string;
  onCancel: () => void;
  isSubmitting: boolean;
  submitColorClassName?: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${submitColorClassName}`}
      >
        {isSubmitting && <DentalLoaderIcon size={16} />}
        {submitLabel}
      </button>
    </div>
  );
}
