"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/doctors", label: "Doctors", icon: Stethoscope, hasChildren: true },
  { href: "/assistants", label: "Assistants", icon: UserRound },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/treatments", label: "Treatments", icon: Activity },

  // ✅ Procedure alohida chiqdi
  { href: "/procedures", label: "Procedures", icon: BadgeDollarSign },

  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings, hasChildren: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [openDoctors, setOpenDoctors] = useState(
    pathname.startsWith("/doctors")
  );

  const [openSettings, setOpenSettings] = useState(
    pathname.startsWith("/settings")
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary-blue px-4 py-6 text-white">
      <h1 className="mb-10 px-3 text-2xl font-extrabold">DentalCRM</h1>

      <nav className="space-y-2">
        {links.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/settings"
              ? pathname.startsWith("/settings")
              : item.href === "/doctors"
              ? pathname.startsWith("/doctors")
              : pathname === item.href;

          if (item.href === "/doctors") {
            return (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() => setOpenDoctors(!openDoctors)}
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

                  {openDoctors ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                {openDoctors && (
                  <div className="ml-8 mt-2 space-y-2">
                    <Link
                      href="/doctors"
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                        pathname === "/doctors"
                          ? "bg-white text-primary-blue"
                          : "text-white/80 hover:bg-white/15"
                      }`}
                    >
                      <List size={16} />
                      Doctors List
                    </Link>

                    <Link
                      href="/doctors/schedule"
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                        pathname === "/doctors/schedule"
                          ? "bg-white text-primary-blue"
                          : "text-white/80 hover:bg-white/15"
                      }`}
                    >
                      <Clock size={16} />
                      Doctor Schedule
                    </Link>
                  </div>
                )}
              </div>
            );
          }

          if (item.href === "/settings") {
            return (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() => setOpenSettings(!openSettings)}
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

                  {openSettings ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                {openSettings && (
                  <div className="ml-8 mt-2 space-y-2">
                    <Link
                      href="/settings/profile"
                      className={`block rounded-xl px-4 py-2 text-sm font-bold transition ${
                        pathname === "/settings/profile"
                          ? "bg-white text-primary-blue"
                          : "text-white/80 hover:bg-white/15"
                      }`}
                    >
                      Profile
                    </Link>

                    <Link
                      href="/settings/change-password"
                      className={`block rounded-xl px-4 py-2 text-sm font-bold transition ${
                        pathname === "/settings/change-password"
                          ? "bg-white text-primary-blue"
                          : "text-white/80 hover:bg-white/15"
                      }`}
                    >
                      Change Password
                    </Link>
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