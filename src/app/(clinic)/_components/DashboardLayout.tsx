"use client";

/**
 * Bu layout ClinicLayout dan keyin ishlaydi.
 * ClinicLayout allaqachon auth tekshirgan — bu yerda faqat UI.
 */

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-dvh overflow-hidden bg-light-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex h-dvh flex-col lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
