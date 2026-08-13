"use client";

import { Check, Clock3, Loader2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { cancelAiAction, confirmAiAction } from "@/src/features/ai/ai.service";
import { getApiErrorMessage } from "@/src/lib/api/http";
import type { AiPendingAction } from "@/src/types/ai.types";

export function AiActionCard({
  action,
  onChange,
}: {
  action: AiPendingAction;
  onChange: (action: AiPendingAction) => void;
}) {
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState("");
  const needsReason = action.type.includes("VOID");
  const pending = action.status === "PENDING";

  async function confirm() {
    if (needsReason && !voidReason.trim()) {
      setError("Void sababini yozing. Bu sabab audit tarixida saqlanadi.");
      return;
    }
    setBusy("confirm");
    setError("");
    try {
      onChange(await confirmAiAction(action.id, voidReason));
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Action tasdiqlanmadi."));
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    setError("");
    try {
      onChange(await cancelAiAction(action.id));
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Action bekor qilinmadi."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/70">
      <div className="flex items-center justify-between gap-3 border-b border-amber-200/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <ShieldCheck size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-950">Tasdiqlash talab qilinadi</p>
            <p className="truncate text-[11px] text-amber-700">{action.type.replaceAll("_", " ").toLowerCase()}</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-amber-700">
          <Clock3 size={12} /> {action.status}
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{action.preview}</p>
        {pending && needsReason ? (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-medium text-slate-700">Void sababi</span>
            <textarea
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Nima sababdan bekor qilinmoqda?"
              className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </label>
        ) : null}
        {error ? <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
      </div>

      {pending ? (
        <div className="flex justify-end gap-2 border-t border-amber-200/70 px-4 py-3">
          <button type="button" onClick={cancel} disabled={busy !== null} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-slate-600 transition hover:bg-white active:scale-[.98] disabled:opacity-50">
            {busy === "cancel" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Bekor qilish
          </button>
          <button type="button" onClick={confirm} disabled={busy !== null} className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-[.98] disabled:opacity-50">
            {busy === "confirm" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm
          </button>
        </div>
      ) : null}
    </section>
  );
}
