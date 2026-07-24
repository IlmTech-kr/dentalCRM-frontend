"use client";

/**
 * File: src/app/(dashboard)/Sidebar.tsx
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

function buildNavItems({
  isStaffAdmin,
  isDoctor,
  isReceptionist,
  isAssistant,
}: RoleFlags): NavItem[] {
  const canSeeDoctorsSection = isStaffAdmin || isReceptionist || isAssistant;

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patients", label: "Patients", icon: Users },
    // Calendar — hammaga ochiq (Doctor, Receptionist, Assistant, Admin)
    { href: "/calendar", label: "Calendar", icon: CalendarRange },
  ];

  if (canSeeDoctorsSection) {
    const children: SubLink[] = [
      { href: "/doctors", label: "Doctors List", icon: List },
    ];

    if (isStaffAdmin) {
      children.push({ href: "/doctors/schedule", label: "Doctor Schedule", icon: Clock });
    }

    items.push({
      href: "/doctors",
      label: "Doctors",
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
    items.push({ href: "/my-schedule", label: "My Schedule", icon: Clock });
  }

  items.push({ href: "/appointments", label: "Appointments", icon: CalendarDays });
  items.push({ href: "/treatments", label: "Treatments", icon: Activity });

  if (isStaffAdmin) {
    items.push({ href: "/procedures", label: "Procedures", icon: BadgeDollarSign });
  }

  const settingsChildren: SubLink[] = [
    { href: "/settings/profile", label: "Profile" },
    { href: "/settings/change-password", label: "Change Password" },
  ];

  if (isStaffAdmin) {
    settingsChildren.push({ href: "/settings/plans", label: "Plans", icon: CreditCard });
  }

  items.push({
    href: "/settings",
    label: "Settings",
    icon: Settings,
    children: settingsChildren,
  });

  return items;
}

export default function Sidebar() {
  const pathname = usePathname();

  const isAdmin = useAuthStore((s) => s.isAdmin());
  const isClinicAdmin = useAuthStore((s) => s.isClinicAdmin());
  const isDoctorRole = useAuthStore((s) => s.isDoctor());
  const isReceptionistRole = useAuthStore((s) => s.isReceptionist());
  const isAssistantRole = useAuthStore((s) => s.isAssistant());

  const isStaffAdmin = isAdmin || isClinicAdmin;

  const NAV_ITEMS = useMemo(
    () =>
      buildNavItems({
        isStaffAdmin,
        isDoctor: isDoctorRole,
        isReceptionist: isReceptionistRole,
        isAssistant: isAssistantRole,
      }),
    [isStaffAdmin, isDoctorRole, isReceptionistRole, isAssistantRole]
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
    <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto bg-primary-blue px-4 py-6 text-white">

      {/* Logo */}
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 border border-white/30">
          <LogoMark small />
        </div>
        <div>
          <h1 className="text-[15px] font-bold leading-tight text-white">
            Dental{" "}
            <span className="bg-gradient-to-r from-sky-300 via-violet-300 to-rose-300 bg-clip-text text-transparent">
              CRM
            </span>
          </h1>
          <p className="text-[10px] font-medium text-white/60">
            Clinic Management
          </p>
        </div>
      </Link>

      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">Main menu</p>
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
  );
}