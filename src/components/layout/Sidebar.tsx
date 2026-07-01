"use client";

/**
 * File: src/app/(dashboard)/Sidebar.tsx
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
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

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients",  label: "Patients",  icon: Users },

  {
    href: "/doctors",
    label: "Doctors",
    icon: Stethoscope,
    children: [
      { href: "/doctors",          label: "Doctors List",   icon: List },
      { href: "/doctors/schedule", label: "Doctor Schedule", icon: Clock },
    ],
  },

  { href: "/assistants",   label: "Assistants",   icon: UserRound },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/treatments",   label: "Treatments",   icon: Activity },
  { href: "/procedures",   label: "Procedures",   icon: BadgeDollarSign },
  { href: "/reports",      label: "Reports",      icon: FileBarChart },

  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    children: [
      { href: "/settings/profile",         label: "Profile" },
      { href: "/settings/change-password", label: "Change Password" },
      { href: "/settings/plans",           label: "Plans", icon: CreditCard },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [openMenus, setOpenMenus] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    NAV_ITEMS.forEach((item) => {
      if (item.children && pathname.startsWith(item.href)) {
        initial.add(item.href);
      }
    });
    return initial;
  });

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
  }, [pathname]);

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