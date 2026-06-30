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

  console.log("[DASHBOARD LAYOUT RENDER]", { checkedRef: checked.current });

  useEffect(() => {
    console.log("[DASHBOARD] useEffect chaqirildi. checked:", checked.current);

    if (checked.current) {
      console.log("[DASHBOARD] checked true -- qaytib chiqdi");
      return;
    }
    checked.current = true;

    const subDomain = getCurrentSubdomain();
    const storedUser = getStoredUser();

    console.log("[DASHBOARD] subDomain:", subDomain);
    console.log("[DASHBOARD] storedUser:", storedUser);
    console.log("[DASHBOARD] window.location.host:", typeof window !== "undefined" ? window.location.host : "SSR");

    if (!subDomain) {
      console.log("[DASHBOARD] subDomain YO'Q -- clearAuthStorage + redirect /login");
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    if (!storedUser) {
      console.log("[DASHBOARD] storedUser YO'Q -- redirect /login");
      router.replace("/login");
      return;
    }

    console.log("[DASHBOARD] hammasi OK -- setAuthData chaqirilyapti");
    useAuthStore.getState().setAuthData({
      user: storedUser as any,
      isAuthenticated: true,
    });
  }, [router]);

  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  console.log("[DASHBOARD] isHydrated:", isHydrated, "isAuthenticated:", isAuthenticated);

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