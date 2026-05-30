"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FilePlus2,
  Loader2,
} from "lucide-react";

type Props = {
  isLoading: boolean;
  isError: boolean;
  hasExistingChart: boolean;
  onUseExisting: () => void;
};

export function ChartStatusCard({
  isLoading,
  isError,
  hasExistingChart,
  onUseExisting,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={22} />
          <div>
            <h3 className="font-black text-slate-900">Chart tekshirilmoqda</h3>
            <p className="text-sm text-slate-500">Bemor kartasi yuklanmoqda.</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasExistingChart) {
    return (
      <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600">
            <CheckCircle2 size={22} />
          </div>

          <div className="flex-1">
            <h3 className="font-black text-emerald-900">
              Mavjud karta topildi
            </h3>
            <p className="mt-1 text-sm leading-6 text-emerald-700">
              Doctor mavjud tish holatini o‘qib, kerak bo‘lsa yangilashi
              mumkin.
            </p>

            <button
              onClick={onUseExisting}
              className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              Kartani yuklash
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[28px] border border-orange-100 bg-orange-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600">
            <AlertCircle size={22} />
          </div>

          <div>
            <h3 className="font-black text-orange-900">Karta topilmadi</h3>
            <p className="mt-1 text-sm leading-6 text-orange-700">
              Bu bemor uchun yangi ko‘rik kartasi ochiladi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600">
          <FilePlus2 size={22} />
        </div>

        <div>
          <h3 className="font-black text-blue-900">Yangi ko‘rik</h3>
          <p className="mt-1 text-sm leading-6 text-blue-700">
            Bemor tishlarining joriy holatini kiriting va karta yarating.
          </p>
        </div>
      </div>
    </div>
  );
}