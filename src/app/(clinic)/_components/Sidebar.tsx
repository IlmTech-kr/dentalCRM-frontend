"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  Stethoscope,
  Users,
  UserRound,
  Settings,
  FileBarChart,
  Activity,
  ChevronDown,
  ChevronRight,
  List,
  Clock,
  BadgeDollarSign,
  CreditCard,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/src/components/shared/BrandLogo";
import { useAuthStore } from "@/src/store/auth.store";

type SubLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: SubLink[];
};

type RoleFlags = {
  isStaffAdmin: boolean;
  isDoctor: boolean;
  isReceptionist: boolean;
  isAssistant: boolean;
};

function buildNavItems(
  t: (key: string) => string,
  { isStaffAdmin, isDoctor, isReceptionist, isAssistant }: RoleFlags
): NavItem[] {
  const canSeeDoctorsSection = isStaffAdmin || isReceptionist || isAssistant;

  const items: NavItem[] = [
    { href: "/dashboard", label: t("sidebar.navDashboard"), icon: LayoutDashboard },
  ];

  if (!isDoctor) {
    items.push({ href: "/patients", label: t("sidebar.navPatients"), icon: Users });
  }

  // Calendar — hammaga ochiq (Doctor, Receptionist, Assistant, Admin)
  items.push({ href: "/calendar", label: t("sidebar.navCalendar"), icon: CalendarRange });

  if (canSeeDoctorsSection) {
    const children: SubLink[] = [
      { href: "/doctors", label: t("sidebar.navDoctorsList"), icon: List },
    ];

    if (isStaffAdmin) {
      children.push({ href: "/doctors/schedule", label: t("sidebar.navDoctorSchedule"), icon: Clock });
    }

    items.push({
      href: "/doctors",
      label: t("sidebar.navDoctors"),
      icon: Stethoscope,
      children,
    });
  }

  // Doctor role uchun alohida "My Schedule" link — Doctors bo'limisiz,
  // to'g'ridan-to'g'ri o'zining schedule sahifasiga olib boradi.
  // Doctor role uchun alohida "My Schedule" link — /doctors/schedule
  // (admin sahifasi, useGetDoctors chaqiradi) dan MUSTAQIL sahifa:
  // /my-schedule useGetDoctors'ni umuman chaqirmaydi, faqat auth.store
  // va useGetDoctorSchedules'dan foydalanadi.
  if (isDoctor) {
    items.push({ href: "/my-schedule", label: t("sidebar.navMySchedule"), icon: Clock });
  }

  if (!isDoctor) {
    items.push({ href: "/appointments", label: t("sidebar.navAppointments"), icon: CalendarDays });
  }
  items.push({ href: "/treatments", label: t("sidebar.navTreatments"), icon: Activity });

  if (isStaffAdmin) {
    items.push({ href: "/procedures", label: t("sidebar.navProcedures"), icon: BadgeDollarSign });
  }

  const settingsChildren: SubLink[] = [
    { href: "/settings/profile", label: t("sidebar.navProfile") },
    { href: "/settings/change-password", label: t("sidebar.navChangePassword") },
  ];

  if (isStaffAdmin) {
    settingsChildren.push({ href: "/settings/plans", label: t("sidebar.navPlans"), icon: CreditCard });
  }

  items.push({
    href: "/settings",
    label: t("sidebar.navSettings"),
    icon: Settings,
    children: settingsChildren,
  });

  return items;
}

export default function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const t = useTranslations("layout");

  const pathname = usePathname();

  const isAdmin = useAuthStore((s) => s.isAdmin());
  const isClinicAdmin = useAuthStore((s) => s.isClinicAdmin());
  const isDoctorRole = useAuthStore((s) => s.isDoctor());
  const isReceptionistRole = useAuthStore((s) => s.isReceptionist());
  const isAssistantRole = useAuthStore((s) => s.isAssistant());

  const isStaffAdmin = isAdmin || isClinicAdmin;

  const NAV_ITEMS = useMemo(
    () =>
      buildNavItems(t, {
        isStaffAdmin,
        isDoctor: isDoctorRole,
        isReceptionist: isReceptionistRole,
        isAssistant: isAssistantRole,
      }),
    [t, isStaffAdmin, isDoctorRole, isReceptionistRole, isAssistantRole]
  );

  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      NAV_ITEMS.forEach((item) => {
        if (item.children && pathname.startsWith(item.href)) {
          next.add(item.href);
        }
      });
      return next;
    });
  }, [pathname, NAV_ITEMS]);

  function toggleMenu(href: string) {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  function isActive(item: NavItem): boolean {
    if (item.children) return pathname.startsWith(item.href);
    return pathname === item.href;
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 flex-col overflow-y-auto bg-primary-blue px-4 py-6 text-white transition-transform duration-300 ease-in-out lg:z-30 lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={onClose}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 border border-white/30">
              <LogoMark small />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-bold leading-tight text-white">
                Dental{" "}
                <span className="bg-gradient-to-r from-sky-300 via-violet-300 to-rose-300 bg-clip-text text-transparent">
                  CRM
                </span>
              </h1>
              <p className="truncate text-[10px] font-medium text-white/60">
                {t("sidebar.tagline")}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">{t("sidebar.mainMenu")}</p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const isOpen = openMenus.has(item.href);

            if (item.children) {
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.href)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      active
                        ? "bg-white text-primary-blue"
                        : "text-white/90 hover:bg-white/15"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={20} />
                      {item.label}
                    </span>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  {isOpen && (
                    <div className="ml-8 mt-2 space-y-2">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                              childActive
                                ? "bg-white text-primary-blue"
                                : "text-white/80 hover:bg-white/15"
                            }`}
                          >
                            {ChildIcon && <ChildIcon size={16} />}
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-white text-primary-blue"
                    : "text-white/90 hover:bg-white/15"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}