"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useInstallPrompt } from "@/src/lib/hooks/UseInstallPrompt";

const DISMISSED_KEY = "pwa-ios-hint-dismissed";

function readDismissed() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * iOS Safari never fires `beforeinstallprompt`, so there's no native
 * install button to hook into there — only a one-time nudge pointing at
 * Safari's own Share > Add to Home Screen flow.
 */
export default function IosInstallHint() {
  const t = useTranslations("layout");
  const { showIOSHint } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!showIOSHint || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-2xl border border-primary-blue/15 bg-white p-3 shadow-xl shadow-primary-blue/10 sm:hidden">
      <p className="flex-1 text-xs font-medium text-slate-700">
        {t("header.iosInstallHint")}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("header.iosInstallHintDismiss")}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={14} />
      </button>
    </div>
  );
}
