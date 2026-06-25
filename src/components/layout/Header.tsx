"use client";

import { LogOut, Search, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { useLogout } from "@/src/features/auth/hooks/useAuth";
import { useAuthStore } from "@/src/store/auth.store";

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const logoutMutation = useLogout();

  const { user, logout } = useAuthStore();

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);

      logout();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "User";

  const firstLetter = displayName?.[0]?.toUpperCase() || "U";

  const roleDisplay = user?.roles?.[0] ? formatRole(user.roles[0]) : "User";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border-color bg-white/80 px-8 backdrop-blur">
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

          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-color bg-white transition hover:bg-slate-50">
            <Bell size={19} />
          </button>

          <div className="relative z-30">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3 transition hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {firstLetter}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold text-slate-900">
                  {displayName}
                </p>

                <p className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                  {roleDisplay}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-400 transition ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-border-color bg-white shadow-lg">
                <div className="border-b border-border-color p-4">
                  <p className="text-xs text-slate-500">Logged in as</p>
                  <p className="font-bold text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>

                  {user?.roles && user.roles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-block rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700"
                        >
                          {formatRole(role)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1 p-2">
                  <Link
                    href="/settings/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    👤 Profile Settings
                  </Link>

                  <Link
                    href="/settings/change-password"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    🔐 Change Password
                  </Link>

                  <div className="my-1 border-t border-border-color" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {dropdownOpen && (
        <div
          className="fixed inset-0 z-20 cursor-default bg-transparent"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </>
  );
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}