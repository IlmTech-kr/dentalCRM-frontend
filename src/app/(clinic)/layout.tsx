"use client";

/**
 * File: src/app/(clinic)/layout.tsx  (yoki ClinicLayout)
 *
 * Tekshiruvlar:
 * 1. currentSubdomain yo'q          → /login
 * 2. storedUser yo'q                → /login (cookie ham yo'q deb hisoblanadi)
 * 3. savedSubDomain !== current     → boshqa clinic, /login
 * 4. Hammasi OK                     → DashboardLayout ko'rsatiladi
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/src/components/layout/DashboardLayout";
import { getCurrentSubdomain } from "@/src/lib/utils/tenant";
import {
  getStoredSubDomain,
  getStoredUser,
  clearAuthStorage,
} from "@/src/lib/auth/storage";
import { useAuthStore } from "@/src/store/auth.store";

export default function ClinicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const currentSubDomain = getCurrentSubdomain();
    const savedSubDomain = getStoredSubDomain();
    const savedUser = getStoredUser();

    // Subdomain yo'q
    if (!currentSubDomain) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    // User yo'q — logout qilingan yoki sessiya yo'q
    if (!savedUser) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    // Boshqa subdomain (boshqa clinic) — localStorage boshqa clinicniki
    if (savedSubDomain && savedSubDomain !== currentSubDomain) {
      clearAuthStorage();
      useAuthStore.getState().logout();
      router.replace("/login");
      return;
    }

    // Hammasi to'g'ri
    useAuthStore.getState().setAuthData({
      user: savedUser as any,
      isAuthenticated: true,
    });

    setChecked(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center bg-light-background">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#35a8f5]" />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}