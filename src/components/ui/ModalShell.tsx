"use client";

import { X } from "lucide-react";

/**
 * Modal (create/edit/pay/void) uchun umumiy qobiq — fon, panel, sarlavha.
 * Dastlab Expenses moduli uchun qurilgan, endi Treatment Payments ham
 * ishlatadi — shu sabab route-local emas, `src/components/ui/`da.
 * Ikki ko'rinish bor:
 * - forma modallari: X yopish tugmasi bilan (showCloseButton default true)
 * - tasdiqlash modallari (Pay/Void): subtitle bilan, X tugmasisiz —
 *   yopish faqat fon bosish yoki footer'dagi Cancel orqali.
 */
export function ModalShell({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  maxWidthClassName = "max-w-md",
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  showCloseButton?: boolean;
  maxWidthClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

      <div
        className={`relative z-10 max-h-[92vh] w-full ${maxWidthClassName} overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl`}
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black text-slate-900">{title}</h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
}
