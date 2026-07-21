"use client";

/**
 * File: src/app/superadmin/(dashboard)/Header.tsx
 */

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { clearAuthStorage, getStoredUser } from "@/src/lib/auth/storage";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Tenantlar", subtitle: "Klinikalar va obunalarni boshqarish" },
  "/dashboard/plans": { title: "Tariflar", subtitle: "Tarif rejalari va faollashtirish" },
  "/dashboard/statistics": { title: "Statistika", subtitle: "Klinikalar bo'yicha daromad hisoboti" },
};

interface StoredSuperAdminUser {
  email?: string;
  name?: string;
  fullName?: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser<StoredSuperAdminUser>();
  const meta = TITLES[pathname] || { title: "Dashboard", subtitle: "" };
  const displayName = user?.fullName || user?.name || user?.email || "Super Admin";
  const initial = displayName.charAt(0).toUpperCase();

  function handleLogout() {
    clearAuthStorage();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-border-color bg-white px-8 py-5">
      <div>
        <h2 className="text-xl font-extrabold text-dark-navy">{meta.title}</h2>
        {meta.subtitle && <p className="text-sm text-text-light">{meta.subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border-color px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 text-xs font-bold text-white">
            {initial}
          </div>
          <span className="text-sm font-semibold text-slate-600">{displayName}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-border-color px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <LogOut size={16} />
          Chiqish
        </button>
      </div>
    </header>
  );
}