"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/src/components/layout/DashboardLayout";

function getSubDomain() {
  if (typeof window === "undefined") return "";

  const host = window.location.hostname;

  if (host.includes(".localhost")) {
    return host.split(".")[0];
  }

  return "";
}

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const currentSubDomain = getSubDomain();
    const savedSubDomain = localStorage.getItem("subDomain");
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken || savedSubDomain !== currentSubDomain) {
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}