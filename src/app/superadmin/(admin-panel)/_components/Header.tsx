"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, Menu } from "lucide-react";
import { clearAuthStorage, getStoredUser } from "@/src/lib/auth/storage";
import { LanguageSwitcher } from "@/src/components/shared/LanguageSwitcher";

const TITLE_KEYS: Record<string, { titleKey: string; subtitleKey: string }> = {
  "/dashboard": {
    titleKey: "superadminHeader.tenantsTitle",
    subtitleKey: "superadminHeader.tenantsSubtitle",
  },
  "/dashboard/plans": {
    titleKey: "superadminHeader.plansTitle",
    subtitleKey: "superadminHeader.plansSubtitle",
  },
  "/dashboard/statistics": {
    titleKey: "superadminHeader.statisticsTitle",
    subtitleKey: "superadminHeader.statisticsSubtitle",
  },
};

interface StoredSuperAdminUser {
  email?: string;
  name?: string;
  fullName?: string;
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const t = useTranslations("layout");
  const tCommon = useTranslations("common");

  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser<StoredSuperAdminUser>();
  const titleKeys = TITLE_KEYS[pathname];
  const meta = titleKeys
    ? { title: t(titleKeys.titleKey), subtitle: t(titleKeys.subtitleKey) }
    : { title: t("superadminHeader.defaultTitle"), subtitle: "" };
  const displayName = user?.fullName || user?.name || user?.email || t("superadminHeader.superAdminFallback");
  const initial = displayName.charAt(0).toUpperCase();

  function handleLogout() {
    clearAuthStorage();
    router.replace("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border-color bg-white px-4 py-5 sm:h-20 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color text-slate-600 transition hover:bg-slate-50 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold text-dark-navy sm:text-xl">{meta.title}</h2>
          {meta.subtitle && <p className="hidden truncate text-sm text-text-light sm:block">{meta.subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />

        <div className="hidden items-center gap-3 rounded-2xl border border-border-color px-3 py-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 text-xs font-bold text-white">
            {initial}
          </div>
          <span className="text-sm font-semibold text-slate-600">{displayName}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-border-color px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:px-4"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">{tCommon("actions.logout")}</span>
        </button>
      </div>
    </header>
  );
}
