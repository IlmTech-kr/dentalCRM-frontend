"use client";

/**
 * Bu layout ClinicLayout dan keyin ishlaydi.
 * ClinicLayout allaqachon auth tekshirgan — bu yerda faqat UI.
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PlanExpiredOverlay from "./PlanExpiredOverlay";
import { useGetCurrentPlan } from "@/src/features/subscriptions/hooks/useSubscription";

const LOCKED_STATUSES = new Set(["EXPIRED", "SUSPENDED", "CANCELED"]);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: subscription } = useGetCurrentPlan();

  // To'lov sahifasida bloklamaymiz — aks holda foydalanuvchi to'lay olmaydi.
  const isBillingPage = pathname?.startsWith("/settings/plans") ?? false;
  const status = subscription?.subscriptionStatus || subscription?.status;
  const isLocked = !isBillingPage && !!status && LOCKED_STATUSES.has(status);

  return (
    <div className="h-dvh overflow-hidden bg-light-background">
      <div className={isLocked ? "pointer-events-none h-dvh select-none blur-sm" : "h-dvh"} aria-hidden={isLocked}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex h-dvh flex-col lg:ml-72">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8">{children}</main>
        </div>
      </div>

      {isLocked && <PlanExpiredOverlay endDate={subscription?.endDate} />}
    </div>
  );
}
