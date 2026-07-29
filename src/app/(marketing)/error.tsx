"use client";

import { useEffect } from "react";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <h1 className="text-2xl font-extrabold text-[#07105f]">Nimadir xato ketdi</h1>
      <p className="max-w-sm text-sm text-slate-600">
        Sahifani yuklashda kutilmagan xatolik yuz berdi. Qayta urinib ko&apos;ring.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-100 transition-all hover:scale-[1.02]"
      >
        Qayta urinish
      </button>
    </div>
  );
}
