"use client";

/**
 * File: src/app/superadmin/(dashboard)/Sidebar.tsx
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, LineChart, ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tenantlar", icon: Building2 },
  { href: "/dashboard/plans", label: "Tariflar", icon: CreditCard },
  { href: "/dashboard/statistics", label: "Statistika", icon: LineChart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 overflow-hidden bg-slate-900 px-4 py-6 text-white">
      <div className="pointer-events-none absolute -left-12 -top-10 h-48 w-48 rounded-full bg-violet-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />

      <Link href="/dashboard" className="relative z-10 mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 shadow-lg shadow-violet-950/40">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold leading-tight text-white">
            Super{" "}
            <span className="bg-gradient-to-r from-sky-300 via-violet-300 to-rose-300 bg-clip-text text-transparent">
              Admin
            </span>
          </h1>
          <p className="text-[10px] font-medium text-white/50">DentalCRM boshqaruvi</p>
        </div>
      </Link>

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
  );
}