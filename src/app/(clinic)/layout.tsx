"use client";

/**
 * File: src/app/(clinic)/layout.tsx  (yoki ClinicLayout)
 *
 * Tekshiruvlar:
 * 1. currentSubdomain yo'q          → /login
 * 2. storedUser yo'q                → /login (cookie ham yo'q deb hisoblanadi)
 * 3. Hammasi OK                     → DashboardLayout ko'rsatiladi
 *
 * Eslatma: subDomain solishtirish (localStorage vs URL) OLIB TASHLANDI.
 * subDomain endi localStorage'da saqlanmaydi — chunki bu eski/boshqa
 * tenant qiymati qolib ketib, to'g'ri tenant uchun ham noto'g'ri
 * "boshqa clinic" deb topilishiga (yoki aksincha) olib kelardi.
 *
 * Haqiqiy tenant/token mos kelish tekshiruvi backendda amalga oshadi:
 * har bir so'rovda cookie (token) va Host header (subdomain) solishtiriladi,
 * mos kelmasa backend 403 AUTH_TENANT_MISMATCH qaytaradi va
 * http.ts interceptori buni ushlab avtomatik /login ga yo'naltiradi.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/src/components/layout/DashboardLayout";
import { getCurrentSubdomain } from "@/src/lib/utils/tenant";
import { getStoredUser, clearAuthStorage } from "@/src/lib/auth/storage";
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

    // Hammasi to'g'ri.
    // Tenant/token mosligi keyingi API so'rovlarida backend tomonidan
    // tekshiriladi (cookie vs Host header). Mos kelmasa, http.ts
    // interceptori 403 AUTH_TENANT_MISMATCH ni ushlab /login ga
    // avtomatik yo'naltiradi — shu yerda qo'shimcha tekshiruv shart emas.
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