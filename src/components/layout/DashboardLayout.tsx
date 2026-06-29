"use client";

/**
 * File: src/app/(dashboard)/layout.tsx
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";

import { useAuthStore } from "@/src/store/auth.store";
import { getCurrentSubdomain } from "@/src/lib/utils/tenant";
import { getStoredUser, clearAuthStorage } from "@/src/lib/auth/storage";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const checked = useRef(false);

  // Store ni mount da bir marta sync qilamiz
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const subDomain = getCurrentSubdomain();
    const storedUser = getStoredUser();

    if (!subDomain) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    useAuthStore.getState().setAuthData({
      user: storedUser as any,
      isAuthenticated: true,
    });
  }, [router]);

  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Hydration tugamaguncha yoki redirect bo'lguncha spinner
  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-light-background">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#35a8f5]" />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-light-background">
      <Sidebar />

      <div className="ml-64 flex h-screen flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}