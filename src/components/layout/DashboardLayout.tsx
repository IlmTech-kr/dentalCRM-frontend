"use client";

/**
 * File: src/app/(dashboard)/layout.tsx
 *
 * Cookie-based auth:
 *
 * storedUser bor  → store ni tiklaymiz → dashboard
 * storedUser yo'q → /login ga redirect
 *
 * Cookie mavjudligini JS orqali tekshirib bo'lmaydi (HttpOnly).
 * User localStorage'da yo'q bo'lsa — sessiya yo'q deb hisoblaymiz.
 */

import { useEffect, useState } from "react";
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
  const [checkingAuth, setCheckingAuth] = useState(true);
  const setAuthData = useAuthStore((state) => state.setAuthData);

  useEffect(() => {
    const subDomain = getCurrentSubdomain();
    const storedUser = getStoredUser();

    /**
     * Case 1: URL da subdomain yo'q
     */
    if (!subDomain) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    /**
     * Case 2: storedUser yo'q → sessiya yo'q → /login ga
     *
     * Cookie HttpOnly bo'lgani uchun JS orqali tekshirib bo'lmaydi.
     * User localStorage'da bo'lmasa — login sahifasi getMe() orqali
     * cookie ni tekshiradi va agar cookie ham yo'q bo'lsa login ko'rsatadi.
     */
    if (!storedUser) {
      router.replace("/login");
      return;
    }

    /**
     * Case 3: storedUser bor → store ni tiklaymiz → dashboard
     *
     * /me chaqirmaymiz — har page o'zgarganda performance muammo.
     * useGetProfile() query user ni kerak bo'lsa tiklaydi.
     */
    setAuthData({
      user: storedUser as any,
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