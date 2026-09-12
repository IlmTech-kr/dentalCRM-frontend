"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  MonitorDown,
  MousePointerClick,
  PlusSquare,
  Share,
} from "lucide-react";

import { useInstallPrompt } from "@/src/lib/hooks/UseInstallPrompt";

export default function InstallAppPage() {
  const t = useTranslations("settings.installApp");
  const { installed, canInstall, showIOSHint, promptInstall } = useInstallPrompt();

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-primary-blue to-primary-blue-dark" />

        <div className="flex items-center gap-4 px-4 py-5 sm:gap-5 sm:px-8 sm:py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/5 text-primary-blue sm:h-14 sm:w-14">
            <MonitorDown size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("header.title")}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{t("header.subtitle")}</p>
          </div>
        </div>
      </div>

      {installed ? (
        <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 sm:p-7">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={28} />
          <div>
            <h2 className="font-black text-emerald-900">{t("installed.title")}</h2>
            <p className="mt-1 text-sm text-emerald-800">{t("installed.description")}</p>
          </div>
        </div>
      ) : (
        <>
          {canInstall && (
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="font-black text-slate-900">{t("android.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("android.description")}</p>

              <button
                type="button"
                onClick={promptInstall}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary-blue px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary-blue/20 transition hover:-translate-y-0.5"
              >
                <MonitorDown size={17} />
                {t("android.button")}
              </button>
            </section>
          )}

          {showIOSHint && (
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="font-black text-slate-900">{t("ios.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("ios.description")}</p>

              <ol className="mt-5 space-y-4">
                <IosStep icon={Share} text={t("ios.step1")} />
                <IosStep icon={MousePointerClick} text={t("ios.step2")} />
                <IosStep icon={PlusSquare} text={t("ios.step3")} />
              </ol>
            </section>
          )}

          {!canInstall && !showIOSHint && (
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="font-black text-slate-900">{t("unsupported.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("unsupported.description")}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function IosStep({
  icon: Icon,
  text,
}: {
  icon: typeof Share;
  text: string;
}) {
  return (
    <li className="flex items-center gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-blue/5 text-primary-blue">
        <Icon size={17} />
      </div>
      <p className="text-sm text-slate-700">{text}</p>
    </li>
  );
}
