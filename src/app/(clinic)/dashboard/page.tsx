"use client";

/**
 * File: src/app/(clinic)/dashboard/page.tsx
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Calendar, Stethoscope,
  CheckCircle2, Clock, BarChart3,
} from "lucide-react";

import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { useAuthStore } from "@/src/store/auth.store";
import { useRevenue } from "@/src/features/statistics/hooks/useStatistics";
import type { RevenueFilterType } from "@/src/features/statistics/services/statistics.service";
import DentalLoader from "@/src/components/ui/DentalLoader";

// ---------------------------------------------------------------------------
// Date helpers (no date-fns)
// ---------------------------------------------------------------------------

function padZ(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${padZ(d.getMonth() + 1)}-${padZ(d.getDate())}`;
}

function todayYMD() {
  return toYMD(new Date());
}

function daysAgoYMD(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toYMD(d);
}

function startOfMonthYMD() {
  const d = new Date();
  d.setDate(1);
  return toYMD(d);
}

function startOfYearYMD() {
  const d = new Date();
  d.setMonth(0, 1);
  return toYMD(d);
}

function formatDisplayDate(d: Date) {
  const months = [
    "Yanvar","Fevral","Mart","Aprel","May","Iyun",
    "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatMoney(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString();
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border-color bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      {loading ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-3 text-2xl font-extrabold text-dark-navy">{value}</p>
      )}
      <p className="mt-1 text-sm text-text-light">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue bar chart (pure CSS)
// ---------------------------------------------------------------------------

function RevenueChart({
  data,
  filter,
}: {
  data: { period: string; revenue: number }[];
  filter: RevenueFilterType;
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  function label(period: string) {
    if (filter === "DAY") return period.slice(5);   // MM-DD
    if (filter === "MONTH") return period.slice(0, 7); // YYYY-MM
    return period;
  }

  return (
    <div className="flex h-44 items-end gap-1.5 overflow-x-auto pb-1">
      {data.map((d) => (
        <div key={d.period} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400">{formatMoney(d.revenue)}</span>
          <div
            className="w-full rounded-t-md bg-[#35a8f5] transition-all"
            style={{ height: `${Math.max((d.revenue / max) * 140, 4)}px` }}
          />
          <span className="text-[9px] text-slate-400">{label(d.period)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appointment row
// ---------------------------------------------------------------------------

function AppointmentRow({ apt }: { apt: any }) {
  const statusColors: Record<string, string> = {
    SCHEDULED:  "bg-blue-100 text-blue-700",
    COMPLETED:  "bg-emerald-100 text-emerald-700",
    CANCELLED:  "bg-red-100 text-red-700",
    NO_SHOW:    "bg-amber-100 text-amber-700",
  };
  const statusLabels: Record<string, string> = {
    SCHEDULED:  "Kutilmoqda",
    COMPLETED:  "Bajarildi",
    CANCELLED:  "Bekor",
    NO_SHOW:    "Kelmadi",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-color bg-white px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#35a8f5]/10 text-xs font-bold text-[#35a8f5]">
        {apt.startTime?.slice(0, 5) ?? "--:--"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-dark-navy">
          {apt.patient?.firstName} {apt.patient?.lastName}
        </p>
        <p className="text-xs text-text-light">
          {apt.doctor?.firstName} {apt.doctor?.lastName}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[apt.status] ?? "bg-slate-100 text-slate-600"}`}>
        {statusLabels[apt.status] ?? apt.status}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const user        = useAuthStore((s) => s.user);
  const isAdmin     = useAuthStore((s) => s.isAdmin());
  const isClinicAdmin = useAuthStore((s) => s.isClinicAdmin());

  const today = todayYMD();

  const [revenueFilter, setRevenueFilter] = useState<RevenueFilterType>("DAY");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate,   setToDate]   = useState<string | null>(null);

  // Patients
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["patients-count"],
    queryFn: async () => {
      const res = await tenantHttp().get(`${ENDPOINTS.patients.list}?size=1`);
      return res.data;
    },
    retry: false,
  });

  // Today appointments
  const { data: todayApts, isLoading: aptsLoading } = useQuery({
    queryKey: ["appointments-today", today],
    queryFn: async () => {
      const res = await tenantHttp().get(`${ENDPOINTS.appointments.byDate}?date=${today}`);
      return res.data;
    },
    retry: false,
  });

  // Doctors (admin only)
  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ["doctors-count"],
    queryFn: async () => {
      const res = await tenantHttp().get(`${ENDPOINTS.doctors.list}?size=1`);
      return res.data;
    },
    retry: false,
    enabled: isClinicAdmin || isAdmin,
  });

  // Revenue — faqat sana tanlanganda so'rov ketadi
  const { data: revenueData, isLoading: revenueLoading } = useRevenue({
    fromDate: fromDate ?? "",
    toDate: toDate ?? "",
    filter: revenueFilter,
    sort: "PERIOD",
    direction: "ASC",
    enabled: Boolean(fromDate && toDate),
  });

  const revenueList  = revenueData?.points ?? [];
  const totalRevenue = revenueData?.totalRevenue ?? 0;
  const totalTxCount = revenueData?.totalTransactionCount ?? 0;

  const todayList      = Array.isArray(todayApts) ? todayApts : todayApts?.content ?? [];
  const todayCount     = todayList.length;
  const completedCount = todayList.filter((a: any) => a.status === "COMPLETED").length;
  const cancelledCount = todayList.filter((a: any) => a.status === "CANCELLED").length;
  const patientsTotal  = patients?.totalCount ?? patients?.totalElements ?? patients?.total ?? 0;
  const doctorsTotal   = doctors?.totalCount ?? doctors?.totalElements ?? doctors?.total ?? 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-dark-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-text-light">
          Xush kelibsiz, {user?.firstName} 👋 — {formatDisplayDate(new Date())}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Jami bemorlar"
          value={patientsTotal.toLocaleString()}
          color="bg-[#35a8f5]"
          loading={patientsLoading}
        />
        <StatCard
          icon={Calendar}
          label="Bugungi qabullar"
          value={todayCount}
          color="bg-violet-500"
          loading={aptsLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Bajarildi / Bekor"
          value={`${completedCount} / ${cancelledCount}`}
          color="bg-emerald-500"
          loading={aptsLoading}
        />
        {(isClinicAdmin || isAdmin) && (
          <StatCard
            icon={Stethoscope}
            label="Shifokorlar"
            value={doctorsTotal}
            color="bg-amber-500"
            loading={doctorsLoading}
          />
        )}
      </div>

      {/* Revenue + Today appointments */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">

        {/* Revenue chart */}
        <div className="rounded-2xl border border-border-color bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#35a8f5]" />
              <h2 className="font-extrabold text-dark-navy">Daromad statistikasi</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter toggle */}
              <div className="flex overflow-hidden rounded-xl border border-border-color text-xs font-semibold">
                {(["DAY", "MONTH", "YEAR"] as RevenueFilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setRevenueFilter(f);
                      const t = todayYMD();
                      if (f === "DAY") {
                        setFromDate(t);
                        setToDate(t);
                      } else if (f === "MONTH") {
                        setFromDate(startOfMonthYMD());
                        setToDate(t);
                      } else {
                        setFromDate(startOfYearYMD());
                        setToDate(t);
                      }
                    }}
                    className={`px-3 py-1.5 transition-colors ${
                      revenueFilter === f
                        ? "bg-[#35a8f5] text-white"
                        : "bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {f === "DAY" ? "Kun" : f === "MONTH" ? "Oy" : "Yil"}
                  </button>
                ))}
              </div>

              <input
                type="date"
                value={fromDate ?? ""}
                onChange={(e) => setFromDate(e.target.value || null)}
                className="rounded-lg border border-border-color px-2 py-1 text-xs text-slate-600 outline-none"
              />
              <span className="text-xs text-slate-400">—</span>
              <input
                type="date"
                value={toDate ?? ""}
                onChange={(e) => setToDate(e.target.value || null)}
                className="rounded-lg border border-border-color px-2 py-1 text-xs text-slate-600 outline-none"
              />
            </div>
          </div>

          <div className="mb-3 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-dark-navy">
              {formatMoney(totalRevenue)}
            </span>
            <span className="text-sm text-text-light">so'm</span>
            <span className="text-xs text-slate-400">• {totalTxCount} ta to'lov</span>
          </div>

          {!fromDate || !toDate ? (
            <div className="flex h-44 flex-col items-center justify-center gap-2 text-slate-400">
              <BarChart3 size={32} className="opacity-30" />
              <p className="text-sm">Sanani tanlang</p>
            </div>
          ) : revenueLoading ? (
            <DentalLoader fullScreen={false} text="Yuklanmoqda..." />
          ) : !revenueList.length ? (
            <div className="flex h-44 flex-col items-center justify-center gap-2 text-slate-400">
              <BarChart3 size={32} className="opacity-30" />
              <p className="text-sm">Ma'lumot topilmadi</p>
            </div>
          ) : (
            <RevenueChart data={revenueList} filter={revenueFilter} />
          )}
        </div>

        {/* Today appointments */}
        <div className="rounded-2xl border border-border-color bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-violet-500" />
              <h2 className="font-extrabold text-dark-navy">Bugungi qabullar</h2>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
              {todayCount} ta
            </span>
          </div>

          {aptsLoading ? (
            <DentalLoader fullScreen={false} text="Yuklanmoqda..." />
          ) : !todayList.length ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <Calendar size={32} className="opacity-30" />
              <p className="text-sm">Bugun qabul yo'q</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {todayList.map((apt: any) => (
                <AppointmentRow key={apt.id} apt={apt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}