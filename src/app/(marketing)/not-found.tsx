import Link from "next/link";

export default function MarketingNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-violet-600">404</p>
      <h1 className="text-2xl font-extrabold text-[#07105f]">Sahifa topilmadi</h1>
      <p className="max-w-sm text-sm text-slate-600">
        Siz izlayotgan sahifa mavjud emas yoki ko&apos;chirilgan.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-100 transition-all hover:scale-[1.02]"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
