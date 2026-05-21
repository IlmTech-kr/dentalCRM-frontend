"use client";

import { LogOut, Search, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import React from "react";

// ✅ IMPORT REACT QUERY HOOK
import { useLogout } from "@/src/features/auth/hooks/useAuth";
import { useGetProfile } from "@/src/features/users/hooks/useUser";
import { useAuthStore } from "@/src/store/auth.store";

// ✅ IMPORT YOUR AUTH STORE

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ✅ USE REACT QUERY HOOK
  const { data: profile, isLoading } = useGetProfile();

  // ✅ USE LOGOUT MUTATION
  const logoutMutation = useLogout();

  // ✅ USE YOUR AUTH STORE
  const { user, setUser, logout } = useAuthStore();

  // Set user in store when profile loads
  React.useEffect(() => {
    if (profile) {
      setUser({
        id: profile.id || "",
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        roles: profile.roles || [],
      });
    }
  }, [profile, setUser]);

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
      // ✅ Also clear from your auth store
      logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "User";

  const firstLetter = displayName?.[0]?.toUpperCase() || "U";

  // Get role display name
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

          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-color bg-white hover:bg-slate-50 transition">
            <Bell size={19} />
          </button>

          {/* ✅ USER PROFILE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3 hover:bg-slate-50 transition"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {isLoading ? "..." : firstLetter}
              </div>

              {/* User Info */}
              {!isLoading && (
                <>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-bold text-slate-900 font-size">
                      {displayName}
                    </p>
                    <p className="inline-block rounded-full bg-blue-100 p-0.5 pl-3 pr-3 text-xs font-semibold text-blue-700">
                      {roleDisplay}
                    </p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </button>

            {/* ✅ DROPDOWN MENU */}
            {dropdownOpen && (
              <div className="absolute right-0 top-14 w-56 rounded-2xl border border-border-color bg-white shadow-lg z-50">
                {/* User Info Section */}
                <div className="border-b border-border-color p-4">
                  <p className="text-xs text-slate-500">Logged in as</p>
                  <p className="font-bold text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  {user?.roles && user.roles.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
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

                {/* Menu Items */}
                <div className="space-y-1 p-2">
                  <Link
                    href="/settings/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    👤 Profile Settings
                  </Link>

                  <Link
                    href="/settings/change-password"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    🔐 Change Password
                  </Link>

                  <div className="border-t border-border-color my-1" />

                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
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

      {/* ✅ OVERLAY - Close dropdown when clicking anywhere */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-20 bg-transparent cursor-default"
          onClick={() => setDropdownOpen(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}
    </>
  );
}

/**
 * Format role name for display
 * SUPER_ADMIN → Super Admin
 * CLINIC_ADMIN → Clinic Admin
 */
function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}