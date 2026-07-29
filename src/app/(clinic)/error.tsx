"use client";

import { useEffect } from "react";

export default function ClinicError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-extrabold text-dark-navy">Nimadir xato ketdi</h2>
      <p className="max-w-sm text-sm text-text-light">
        Sahifani yuklashda kutilmagan xatolik yuz berdi. Qayta urinib ko&apos;ring.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 rounded-2xl bg-[#35a8f5] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#1d8ee8]"
      >
        Qayta urinish
      </button>
    </div>
  );
}
