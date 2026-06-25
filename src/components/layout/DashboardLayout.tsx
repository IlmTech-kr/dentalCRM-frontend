"use client";

/**
 * File: src/app/(dashboard)/layout.tsx
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";

import { useAuthStore } from "@/src/store/auth.store";
import { getCurrentSubdomain } from "@/src/lib/utils/tenant";
import {
  getStoredAccessToken,
  getStoredUser,
  clearAuthStorage,
} from "@/src/lib/auth/storage";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  const setAuthData = useAuthStore((state) => state.setAuthData);

  useEffect(() => {
    const subDomain = getCurrentSubdomain();
    const accessToken = getStoredAccessToken();
    const storedUser = getStoredUser();

    /**
     * Case 1: URL da subdomain yo'q
     * clinic11.localhost:3000 formatida ochilishi kerak.
     */
    if (!subDomain) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    /**
     * Case 2: accessToken yo'q → login ga
     * authUser bo'lsa ham saqlamang — token asosiy source.
     */
    if (!accessToken) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    /**
     * Case 3: Token bor → store ni tiklaymiz.
     *
     * /me chaqirmaymiz — bu layoutda har page o'zgarganda
     * chaqirilishi performance muammo yaratadi.
     * /me ni faqat login paytida (useLogin onSuccess) chaqiramiz.
     *
     * storedUser null bo'lishi mumkin — bu holatda store dagi
     * user null bo'ladi, lekin isAuthenticated: true bo'ladi.
     * Keyingi useGetProfile() query user ni tiklaydi.
     */
    setAuthData({
      user: storedUser as any,
      accessToken,
      isAuthenticated: true,
    });

    setCheckingAuth(false);
  }, [setAuthData, router]);

  if (checkingAuth) {
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