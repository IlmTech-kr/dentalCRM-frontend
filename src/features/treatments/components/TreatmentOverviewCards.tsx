"use client";

import { useTranslations } from "next-intl";
import { Activity, CalendarDays, ClipboardList, ShieldCheck } from "lucide-react";

type Props = {
  toothCount: number;
  stageCount: number;
  totalVisits: number;
  totalPrice: number;
};

export function TreatmentOverviewCards({
  toothCount,
  stageCount,
  totalVisits,
  totalPrice,
}: Props) {
  const t = useTranslations("treatments");

  return (
    <div className="grid grid-cols-2 gap-4">
      <MiniStat
        icon={<Activity size={19} />}
        label={t("overviewCards.teeth")}
        value={toothCount.toString()}
      />

      <MiniStat
        icon={<ClipboardList size={19} />}
        label={t("overviewCards.stages")}
        value={stageCount.toString()}
      />

      <MiniStat
        icon={<CalendarDays size={19} />}
        label={t("overviewCards.visit")}
        value={totalVisits.toString()}
      />

      <MiniStat
        icon={<ShieldCheck size={19} />}
        label={t("overviewCards.estimated")}
        value={totalPrice.toLocaleString()}
      />
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}