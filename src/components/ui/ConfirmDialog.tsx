"use client";

import { useConfirmStore } from "@/src/store/confirm.store";
import { ModalShell } from "@/src/components/ui/ModalShell";

/**
 * window.confirm() ning umumiy almashtiruvchisi — providers.tsx ichida
 * BIR MARTA render qilinadi (ToastContainer bilan bir xil pattern).
 * Hech qanday sahifa o'zi bu componentni chaqirmaydi — faqat
 * useConfirm() hook orqali so'rov yuboradi, natijani shu yerdagi
 * tugmalar hal qiladi (resolve(true/false)).
 */
export function ConfirmDialog() {
  const pending = useConfirmStore((state) => state.pending);
  const resolve = useConfirmStore((state) => state.resolve);

  if (!pending) return null;

  const isDanger = pending.tone === "danger";

  return (
    <ModalShell
      title={pending.title}
      subtitle={pending.message}
      onClose={() => resolve(false)}
      showCloseButton={false}
      maxWidthClassName="max-w-sm"
    >
      <div className="flex gap-3 px-6 py-5">
        <button
          type="button"
          onClick={() => resolve(false)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          {pending.cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => resolve(true)}
          autoFocus
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${
            isDanger
              ? "bg-red-600 hover:bg-red-700"
              : "bg-primary-blue hover:bg-primary-blue-dark"
          }`}
        >
          {pending.confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
