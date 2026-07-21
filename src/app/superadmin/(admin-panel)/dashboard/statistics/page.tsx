"use client";

/**
 * File: src/app/superadmin/(dashboard)/dashboard/statistics/page.tsx
 */

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  Building2,
  Loader2,
  Receipt,
  TrendingUp,
} from "lucide-react";

import { useRevenueByClinic } from "@/src/features/superadmin/statistics/UseStatisticsAdmin";

const SUBSCRIPTION_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-200",
  TRIAL: "bg-sky-50 text-sky-600 border-sky-200",
  EXPIRED: "bg-red-50 text-red-600 border-red-200",
  CANCELED: "bg-slate-100 text-slate-500 border-slate-200",
  SUSPENDED: "bg-amber-50 text-amber-600 border-amber-200",
};

const RANK_STYLES = [
  "bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-200", // 1
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-200", // 2
  "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-200", // 3
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export default function StatisticsPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonthISO());
  const [toDate, setToDate] = useState(todayISO());
  const [sort, setSort] = useState<"PERIOD" | "REVENUE" | "CLINIC">("REVENUE");
  const [direction, setDirection] = useState<"ASC" | "DESC">("DESC");

  const { data: rows = [], isLoading, isError } = useRevenueByClinic({
    fromDate,
    toDate,
    sort,
    direction,
  });

  const totalRevenue = rows.reduce((sum, r) => sum + (r.revenue || 0), 0);
  const totalTransactions = rows.reduce((sum, r) => sum + (r.transactionCount || 0), 0);
  const activeClinics = new Set(rows.map((r) => r.tenantId)).size;
  const maxRevenue = useMemo(() => Math.max(1, ...rows.map((r) => r.revenue || 0)), [rows]);

  function toggleDirection() {
    setDirection((d) => (d === "ASC" ? "DESC" : "ASC"));
  }

  return (
    <div className="space-y-6">
      {/* Filtrlar */}
      <div className="relative overflow-hidden rounded-3xl border border-border-color bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/10 via-violet-500/10 to-rose-400/10 blur-2xl" />

        <div className="relative flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Boshlanish sanasi
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-11 rounded-xl border border-border-color bg-slate-50 px-3 text-sm outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Tugash sanasi
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-11 rounded-xl border border-border-color bg-slate-50 px-3 text-sm outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Saralash
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-11 rounded-xl border border-border-color bg-slate-50 px-3 text-sm outline-none focus:border-violet-400"
            >
              <option value="REVENUE">Daromad</option>
              <option value="CLINIC">Klinika</option>
              <option value="PERIOD">Davr</option>
            </select>
          </div>
          <button
            onClick={toggleDirection}
            className="flex h-11 items-center gap-2 rounded-xl border border-border-color px-4 text-sm font-bold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
          >
            <ArrowDownUp size={15} />
            {direction === "DESC" ? "Kamayish" : "O'sish"}
          </button>
        </div>
      </div>

      {/* Statistik kartalar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Jami daromad"
          value={`${formatMoney(totalRevenue)} so'm`}
        />
        <StatCard icon={Receipt} label="Tranzaksiyalar" value={String(totalTransactions)} />
        <StatCard icon={Building2} label="Faol klinikalar" value={String(activeClinics)} />
      </div>

      {/* Jadval */}
      <div className="overflow-hidden rounded-3xl border border-border-color bg-white shadow-sm">
        <div className="border-b border-border-color px-6 py-4">
          <h2 className="text-base font-bold text-dark-navy">Klinikalar bo'yicha daromad</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" size={22} />
          </div>
        ) : isError ? (
          <p className="px-6 py-10 text-center text-sm text-red-500">
            Statistikani yuklab bo'lmadi.
          </p>
        ) : rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            Tanlangan davr uchun ma'lumot topilmadi.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-color text-xs uppercase text-slate-400">
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Klinika</th>
                <th className="px-6 py-3 font-semibold">Obuna holati</th>
                <th className="px-6 py-3 font-semibold text-right">Tranzaksiyalar</th>
                <th className="px-6 py-3 font-semibold">Daromad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const name = r.clinic?.name || r.tenantId;
                const share = Math.round(((r.revenue || 0) / maxRevenue) * 100);

                return (
                  <tr
                    key={r.tenantId}
                    className="group border-b border-border-color transition last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      {i < 3 ? (
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shadow-md ${RANK_STYLES[i]}`}
                        >
                          {i + 1}
                        </span>
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center text-xs font-bold text-slate-400">
                          {i + 1}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 text-xs font-bold text-white">
                          {initials(name)}
                        </div>
                        <div>
                          <p className="font-semibold text-dark-navy">{name}</p>
                          {r.clinic?.subDomain && (
                            <p className="text-xs text-slate-400">{r.clinic.subDomain}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                          SUBSCRIPTION_STYLES[r.clinic?.subscriptionStatus || ""] ||
                          "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {r.clinic?.subscriptionStatus || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-slate-500">{r.transactionCount}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-right font-bold text-dark-navy">
                          {formatMoney(r.revenue)}
                        </span>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 transition-all"
                            style={{ width: `${Math.max(share, 4)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-border-color bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 text-white">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
        <p className="truncate text-xl font-extrabold text-dark-navy">{value}</p>
      </div>
    </div>
  );
}