"use client";

/**
 * /dashboard va /dashboard/plans shu layout ostida ochiladi.
 * Auth tekshiruvi shu yerda — ichki sahifalar faqat UI bilan shug'ullanadi.
 *
 * SUPERADMIN_ACCESS_RULES hozircha bo'sh (A jadvali: faqat auth, rol farqi
 * yo'q) — quyidagi rol tekshiruvi shu bois hozircha hech narsani
 * cheklamaydi, lekin bu layout qayta mount bo'lmagani uchun pathname'ga
 * bog'liq alohida effekt sifatida ulangan, xuddi (clinic)/layout.tsx'dagidek
 * — access.ts'ga rol qoidasi qo'shilganda darhol ishlay boshlaydi.
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser } from "@/src/lib/auth/storage";
import DentalLoader from "@/src/components/ui/DentalLoader";
import { useAuthStore } from "@/src/store/auth.store";
import { SUPERADMIN_ACCESS_RULES, isRouteAllowed } from "@/src/config/access";
import Header from "./_components/Header";
import Sidebar from "./_components/Sidebar";
export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getStoredUser()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;

    const roles = useAuthStore.getState().user?.roles || [];

    if (!isRouteAllowed(pathname, roles, SUPERADMIN_ACCESS_RULES)) {
      router.replace("/dashboard");
    }
  }, [ready, pathname, router]);

  if (!ready) return <DentalLoader text="Loading..." />;

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