"use client";

import { Search, UserRound } from "lucide-react";

type Props = {
  patientId: string;
  onPatientIdChange: (value: string) => void;
  onSearch: () => void;
};

export function PatientChartLookup({
  patientId,
  onPatientIdChange,
  onSearch,
}: Props) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <UserRound size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">
              Bemorni ko‘rikka olish
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Patient ID orqali mavjud dental chart tekshiriladi.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 md:flex-row lg:w-[620px]">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={patientId}
              onChange={(e) => onPatientIdChange(e.target.value)}
              placeholder="Patient ID"
              className="input-ui pl-11"
            />
          </div>

          <button
            onClick={onSearch}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            <Search size={18} />
            Tekshirish
          </button>
        </div>
      </div>
    </section>
  );
}