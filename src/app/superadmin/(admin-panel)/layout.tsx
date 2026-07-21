"use client";

/**
 * File: src/app/superadmin/(dashboard)/layout.tsx
 *
 * /dashboard va /dashboard/plans shu layout ostida ochiladi.
 * Auth tekshiruvi shu yerda — ichki sahifalar faqat UI bilan shug'ullanadi.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/src/lib/auth/storage";
import DentalLoader from "@/src/components/ui/DentalLoader";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getStoredUser()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

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