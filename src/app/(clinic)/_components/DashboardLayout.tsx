"use client";

/**
 * Bu layout ClinicLayout dan keyin ishlaydi.
 * ClinicLayout allaqachon auth tekshirgan — bu yerda faqat UI.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PlanExpiredOverlay from "./PlanExpiredOverlay";
import { useGetCurrentPlan } from "@/src/features/subscriptions/hooks/useSubscription";
import { useUiStore } from "@/src/store/ui.store";
import ThemeSettingsSync from "@/src/features/settings/ThemeSettingsSync";

const LOCKED_STATUSES = new Set(["EXPIRED", "SUSPENDED", "CANCELED"]);
const AiDrawer = dynamic(() => import("@/src/features/ai/components/AiDrawer"), {
  ssr: false,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: subscription } = useGetCurrentPlan();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const aiDrawerOpen = useUiStore((s) => s.aiDrawerOpen);

  // To'lov sahifasida bloklamaymiz — aks holda foydalanuvchi to'lay olmaydi.
  const isBillingPage = pathname?.startsWith("/settings/plans") ?? false;
  const status = subscription?.subscriptionStatus || subscription?.status;
  const isLocked = !isBillingPage && !!status && LOCKED_STATUSES.has(status);

  return (
    <div className="clinic-theme h-dvh overflow-hidden bg-light-background">
      <ThemeSettingsSync />
      <div className={isLocked ? "pointer-events-none h-dvh select-none blur-sm" : "h-dvh"} aria-hidden={isLocked}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div
          className={`flex h-dvh flex-col transition-[margin] duration-300 ease-in-out ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
          }`}
        >
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8">{children}</main>
        </div>
      </div>

      {isLocked && <PlanExpiredOverlay endDate={subscription?.endDate} />}
      {aiDrawerOpen && !isLocked ? <AiDrawer /> : null}
    </div>
  );
}
