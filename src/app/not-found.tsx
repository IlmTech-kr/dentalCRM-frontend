import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-light-background px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">404</p>
      <h1 className="text-2xl font-extrabold text-dark-navy">Sahifa topilmadi</h1>
      <p className="max-w-sm text-sm text-text-light">
        Siz izlayotgan sahifa mavjud emas yoki ko&apos;chirilgan.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-2xl bg-[#35a8f5] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#1d8ee8]"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
