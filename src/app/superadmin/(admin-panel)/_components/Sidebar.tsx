"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, LineChart, ShieldCheck, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tenantlar", icon: Building2 },
  { href: "/dashboard/plans", label: "Tariflar", icon: CreditCard },
  { href: "/dashboard/statistics", label: "Statistika", icon: LineChart },
];

export default function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 overflow-hidden bg-slate-900 px-4 py-6 text-white transition-transform duration-300 ease-in-out lg:z-30 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute -left-12 -top-10 h-48 w-48 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative z-10 mb-8 flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={onClose}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 shadow-lg shadow-violet-950/40">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-bold leading-tight text-white">
                Super{" "}
                <span className="bg-gradient-to-r from-sky-300 via-violet-300 to-rose-300 bg-clip-text text-transparent">
                  Admin
                </span>
              </h1>
              <p className="truncate text-[10px] font-medium text-white/50">DentalCRM boshqaruvi</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <p className="relative z-10 mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Menu
        </p>

        <nav className="relative z-10 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 text-white shadow-lg shadow-violet-950/30"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
