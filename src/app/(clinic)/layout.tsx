"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/src/components/layout/DashboardLayout";
import { getCurrentSubdomain } from "@/src/lib/utils/tenant";
import { getStoredSubDomain, getStoredUser, clearAuthStorage } from "@/src/lib/auth/storage";

export default function ClinicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const currentSubDomain = getCurrentSubdomain();
    const savedSubDomain = getStoredSubDomain();
    const savedUser = getStoredUser();

    if (!currentSubDomain || !savedUser) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    if (savedSubDomain && savedSubDomain !== currentSubDomain) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}