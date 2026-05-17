"use client";

import { LogOut, Search, Bell } from "lucide-react";
import { logout } from "@/src/features/auth/auth.service";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border-color bg-white/80 px-8 backdrop-blur">
      <div>
        <h2 className="text-2xl font-extrabold text-dark-navy">Dashboard</h2>
        <p className="text-sm text-text-light">Welcome back to your clinic</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden h-11 items-center gap-3 rounded-2xl border border-border-color bg-slate-50 px-4 md:flex">
          <Search size={18} className="text-slate-400" />
          <input
            className="bg-transparent text-sm outline-none"
            placeholder="Search..."
          />
        </div>

        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-color bg-white">
          <Bell size={19} />
        </button>

        <button
          onClick={logout}
          className="flex h-11 items-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-bold text-red-500"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}