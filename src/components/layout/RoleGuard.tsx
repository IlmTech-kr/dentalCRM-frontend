"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/auth.store";

type RoleGuardProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

export default function RoleGuard({ children, allowedRoles }: Readonly<RoleGuardProps>) {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
    setMounted(true);
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && user?.roles) {
      const hasAllowedRole = user.roles.some((role) =>
        allowedRoles.includes(role)
      );

      if (!hasAllowedRole) {
        router.replace("/dashboard");
      }
    }
  }, [mounted, isAuthenticated, user, allowedRoles, router]);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}