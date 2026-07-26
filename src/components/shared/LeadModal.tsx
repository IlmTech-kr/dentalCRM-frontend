"use client";

/**
 * File: src/components/shared/LeadModal.tsx
 *
 * Ikki xil ishlatish:
 * 1. Auto: prop berilmasa — 1 soniyadan keyin avtomatik ochiladi
 * 2. Manual: open={true} — tashqaridan boshqariladi (Demo olish tugmasi)
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Phone, User, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

const SHOW_DELAY_MS = 1000;

type FormState = "idle" | "loading" | "success";

interface LeadModalProps {
  open?: boolean;
  onClose?: () => void;
}

export default function LeadModal({ open: controlledOpen, onClose }: LeadModalProps) {
  const t = useTranslations("layout");
  const tCommon = useTranslations("common");

  const isControlled = controlledOpen !== undefined;

  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  // Auto mode — 1 soniyadan keyin ochiladi
  useEffect(() => {
    if (isControlled) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isControlled]);

  // Controlled mode — tashqaridan open o'zgarganda
  useEffect(() => {
    if (!isControlled) return;
    if (controlledOpen) {
      setOpen(true);
      // Form ni reset qilamiz
      setFormState("idle");
      setName("");
      setPhone("");
      setError("");
    } else {
      setOpen(false);
    }
  }, [isControlled, controlledOpen]);

  function handleClose() {
    setOpen(false);
    onClose?.();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError(t("leadModal.errorNameRequired")); return; }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
      setError(t("leadModal.errorInvalidPhone"));
      return;
    }

    setFormState("loading");

    // TODO: backend ga yuborish
    await new Promise((res) => setTimeout(res, 1500));

    setFormState("success");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20">
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500" />

        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>

        <div className="px-8 py-7">
          {formState === "success" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={36} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">{t("leadModal.successTitle")}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t.rich("leadModal.successMessage", {
                  b: (chunks) => (
                    <span className="font-bold text-slate-700">{chunks}</span>
                  ),
                })}
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 rounded-2xl bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-8 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                {tCommon("actions.close")}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500">
                  <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                    <path d="M12 2C8 2 5 5 5 9c0 2.5 1.5 4.5 3 6l4 5 4-5c1.5-1.5 3-3.5 3-6 0-4-3-7-7-7z" fill="white" fillOpacity="0.9" />
                    <circle cx="12" cy="9" r="2.5" fill="white" fillOpacity="0.5" />
                  </svg>
                </div>

                <h2 className="text-2xl font-black leading-tight text-slate-900">
                  {t.rich("leadModal.heading", {
                    accent: (chunks) => (
                      <span className="bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 bg-clip-text text-transparent">
                        {chunks}
                      </span>
                    ),
                  })}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {t.rich("leadModal.description", {
                    b: (chunks) => (
                      <span className="font-semibold text-slate-700">{chunks}</span>
                    ),
                  })}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    t("leadModal.badgeFreeConsultation"),
                    t("leadModal.badgeInstallService"),
                    t("leadModal.badgeSupport247"),
                  ].map((badge) => (
                    <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                      <CheckCircle2 size={11} />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex h-12 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white">
                  <User size={17} className="shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder={t("leadModal.namePlaceholder")}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    disabled={formState === "loading"}
                  />
                </div>

                <div className="flex h-12 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-400 focus-within:bg-white">
                  <Phone size={17} className="shrink-0 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    placeholder={t("leadModal.phonePlaceholder")}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    disabled={formState === "loading"}
                  />
                </div>

                {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 font-bold text-white shadow-lg shadow-violet-200 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {formState === "loading" ? (
                    <><Loader2 size={18} className="animate-spin" />{t("leadModal.submitting")}</>
                  ) : (
                    <>{t("leadModal.submitButton")} <ArrowRight size={18} /></>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  {t("leadModal.privacyNote")}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}