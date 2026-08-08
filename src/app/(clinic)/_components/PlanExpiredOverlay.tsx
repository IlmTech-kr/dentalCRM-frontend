"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CreditCard, ShieldAlert } from "lucide-react";

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

export default function PlanExpiredOverlay({ endDate }: { endDate?: string | null }) {
  const t = useTranslations("settings.plans.lock");
  const router = useRouter();
  const formattedEndDate = formatDate(endDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-navy/40" />

      <div className="card relative w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert className="h-7 w-7 text-danger-color" />
        </div>

        <h2 className="text-lg font-bold text-dark-navy">{t("title")}</h2>
        <p className="mt-2 text-sm text-text-light">{t("subtitle")}</p>

        {formattedEndDate && (
          <p className="mt-3 text-xs font-medium text-text-light">
            {t("expiredOn", { date: formattedEndDate })}
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push("/settings/plans")}
          className="btn-primary mt-6 flex w-full items-center justify-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          {t("cta")}
        </button>
      </div>
    </div>
  );
}
