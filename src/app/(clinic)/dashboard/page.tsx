"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Users, Calendar, Stethoscope,
  CheckCircle2, XCircle,
  Clock, BarChart3,
  Wallet, TrendingUp, Percent, PieChart,
  type LucideIcon,
} from "lucide-react";

import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { useAuthStore } from "@/src/store/auth.store";
import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";
import {
  useRevenue,
  useDoctorRevenueStatistics,
  usePayrollSummary,
} from "@/src/features/statistics/hooks/useStatistics";
import type {
  RevenueFilterType,
  RevenueResponse,
} from "@/src/features/statistics/services/statistics.service";
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

/** Filtr turiga mos default sana oralig'ini qaytaradi. */
function defaultRangeFor(filter: RevenueFilterType) {
  const today = todayYMD();

  if (filter === "DAY") return { from: today, to: today };
  if (filter === "MONTH") return { from: startOfMonthYMD(), to: today };
  return { from: startOfYearYMD(), to: today };
}

function formatDisplayDate(d: Date, months: string[]) {
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * MUHIM: `amount` backend'dan `undefined`/`null` bo'lib kelishi mumkin.
 * Shuning uchun avval xavfsiz songa o'giramiz.
 */
function formatMoney(amount?: number | null) {
  const value = Number(amount) || 0;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

function formatFullMoney(amount?: number | null) {
  const value = Number(amount) || 0;
  return `${value.toLocaleString()} so'm`;
}

function niceStep(rough: number) {
  if (rough <= 0) return 1;
  const exp = Math.floor(Math.log10(rough));
  const base = rough / Math.pow(10, exp);
  const niceBase = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return niceBase * Math.pow(10, exp);
}

function buildTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const step = niceStep(max / count);
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v));
  if (ticks.length < 2) ticks.push(step);
  return ticks;
}

function formatPeriodLabel(period: string, filter: RevenueFilterType, months: string[]) {
  const parts = period.split("-").map(Number);
  if (filter === "YEAR") return period;
  if (filter === "MONTH") {
    const [y, m] = parts;
    return `${months[(m ?? 1) - 1] ?? period} ${y}`;
  }
  const [, m, d] = parts;
  return `${months[(m ?? 1) - 1]?.slice(0, 3) ?? ""} ${d}`;
}

/**
 * Backend valyuta bo'yicha ajratib qaytaradi (`currencies: [...]`) — UI
 * hozircha bitta ("asosiy") valyutani ko'rsatadi.
 */
function primaryRevenue(data?: RevenueResponse) {
  return data?.currencies?.[0];
}

function getDoctorId(doctor: any) {
  return doctor?.id || doctor?._id || "";
}

function getDoctorFullName(doctor: any) {
  return (
    doctor?.fullName ||
    doctor?.name ||
    `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim()
  );
}

// ---------------------------------------------------------------------------
// Stats donut chart
// ---------------------------------------------------------------------------

type DonutSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
  icon: LucideIcon;
};

const DONUT_SIZE = 200;
const DONUT_STROKE = 24;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE * 2) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function StatsDonutChart({
  segments,
  loading,
}: {
  segments: DonutSegment[];
  loading?: boolean;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cumulative = 0;

  return (
    <div className="rounded-2xl border border-border-color bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-blue/10">
          <PieChart size={17} className="text-primary-blue" />
        </span>
        <h2 className="font-extrabold text-dark-navy">{t("stats.overviewTitle")}</h2>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
          <div className="h-[200px] w-[200px] shrink-0 animate-pulse rounded-full bg-slate-100" />
          <div className="grid w-full grid-cols-2 gap-2.5 sm:w-auto sm:min-w-[260px]">
            {segments.map((s) => (
              <div key={s.key} className="h-[86px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      ) : total === 0 ? (
        <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
          <PieChart size={30} className="opacity-30" />
          <p className="text-sm font-medium">{tCommon("feedback.noData")}</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
          {/* Donut */}
          <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
            <svg
              width={DONUT_SIZE}
              height={DONUT_SIZE}
              viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
              className="-rotate-90 overflow-visible"
            >
              <circle
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={DONUT_RADIUS}
                fill="none"
                stroke="#eef2f6"
                strokeWidth={DONUT_STROKE}
              />
              {segments.map((s) => {
                if (s.value <= 0) return null;
                const fraction = s.value / total;
                const gap = segments.filter((x) => x.value > 0).length > 1 ? 3 : 0;
                const dash = Math.max(fraction * DONUT_CIRCUMFERENCE - gap, 0);
                const dashOffset = -cumulative;
                cumulative += fraction * DONUT_CIRCUMFERENCE;
                const isHovered = hoveredKey === s.key;
                const isDimmed = hoveredKey !== null && !isHovered;

                return (
                  <circle
                    key={s.key}
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_RADIUS}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={isHovered ? DONUT_STROKE + 6 : DONUT_STROKE}
                    strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE - dash}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-200"
                    style={{ opacity: isDimmed ? 0.35 : 1 }}
                    onMouseEnter={() => setHoveredKey(s.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-extrabold text-dark-navy">
                {(hoveredKey
                  ? segments.find((s) => s.key === hoveredKey)?.value ?? total
                  : total
                ).toLocaleString()}
              </p>
              <p className="max-w-[110px] truncate text-[11px] font-semibold text-text-light">
                {hoveredKey
                  ? segments.find((s) => s.key === hoveredKey)?.label
                  : t("stats.overviewTotal")}
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className="grid w-full grid-cols-2 gap-2.5 sm:w-auto sm:min-w-[260px]">
            {segments.map((s) => {
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              const isHovered = hoveredKey === s.key;
              const Icon = s.icon;

              return (
                <button
                  type="button"
                  key={s.key}
                  onMouseEnter={() => setHoveredKey(s.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 ${
                    isHovered
                      ? "-translate-y-0.5 border-transparent shadow-md"
                      : "border-border-color shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                  style={
                    isHovered ? { boxShadow: `0 10px 20px -8px ${s.color}66` } : undefined
                  }
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${s.color}1a` }}
                    >
                      <Icon size={16} style={{ color: s.color }} />
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: s.color }}>
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold leading-tight text-dark-navy">
                      {s.value.toLocaleString()}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-text-light">
                      {s.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date range picker
// ---------------------------------------------------------------------------

function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border-color bg-white px-1.5 py-1 shadow-sm">
      <input
        type="date"
        value={from}
        max={to || undefined}
        onChange={(e) => onFromChange(e.target.value)}
        className="w-[120px] rounded-lg bg-transparent px-1.5 py-1 text-xs font-semibold text-slate-600 outline-none transition focus:bg-slate-50"
      />
      <span className="select-none text-xs text-slate-300">→</span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => onToChange(e.target.value)}
        className="w-[120px] rounded-lg bg-transparent px-1.5 py-1 text-xs font-semibold text-slate-600 outline-none transition focus:bg-slate-50"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue period card (bosiladigan)
// ---------------------------------------------------------------------------

function RevenuePeriodCard({
  label,
  hint,
  amount,
  txCount,
  active,
  loading,
  accent,
  onClick,
}: {
  label: string;
  hint: string;
  amount: number;
  txCount: number;
  active: boolean;
  loading?: boolean;
  accent: string;
  onClick: () => void;
}) {
  const t = useTranslations("dashboard");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
        active
          ? "border-transparent bg-white ring-2 ring-offset-1"
          : "border-border-color bg-white hover:border-slate-300"
      }`}
      style={active ? ({ "--tw-ring-color": accent } as any) : undefined}
    >
      {/* Yuqori aksent chizig'i */}
      <span
        className={`absolute inset-x-0 top-0 h-1 transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
        }`}
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-bold text-dark-navy">{label}</p>
        {active && (
          <span
            className="shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {t("revenue.activeBadge")}
          </span>
        )}
      </div>

      <p className="mt-0.5 truncate text-[11px] text-text-light">{hint}</p>

      {loading ? (
        <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <div className="mt-3 flex items-end gap-1.5">
          <span
            className="text-2xl font-extrabold leading-none tracking-tight sm:text-[28px]"
            style={{ color: active ? accent : undefined }}
          >
            {formatMoney(amount)}
          </span>
          <span className="pb-0.5 text-xs font-bold text-text-light">
            {t("revenue.currency")}
          </span>
        </div>
      )}

      <p className="mt-2 text-[11px] font-medium text-slate-400">
        {t("revenue.transactions", { count: txCount })}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Revenue bar chart
// ---------------------------------------------------------------------------

const REVENUE_CHART_HEIGHT = 176;

function RevenueChart({
  data,
  filter,
}: {
  data: { period: string; revenue: number; transactionCount?: number }[];
  filter: RevenueFilterType;
}) {
  const t = useTranslations("dashboard");
  const months = t.raw("months") as string[];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => Number(d.revenue) || 0), 0);
  const ticks = buildTicks(max);
  const niceMax = ticks[ticks.length - 1] || 1;
  const peakIndex = data.reduce(
    (best, d, i, arr) =>
      (Number(d.revenue) || 0) > (Number(arr[best]?.revenue) || 0) ? i : best,
    0
  );
  const showEveryNth = data.length > 10 ? Math.ceil(data.length / 8) : 1;

  function axisLabel(period: string) {
    if (filter === "DAY") return period.slice(8);
    if (filter === "MONTH") return period.slice(5, 7);
    return period;
  }

  return (
    <div className="select-none">
      <div className="relative" style={{ height: REVENUE_CHART_HEIGHT }}>
        {/* Gridlines + y-axis */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[...ticks].reverse().map((tick) => (
            <div key={tick} className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-right text-[10px] font-medium text-slate-400">
                {formatMoney(tick)}
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1 pl-11">
          {data.map((d, i) => {
            const value = Number(d.revenue) || 0;
            const pct =
              niceMax > 0 ? Math.max((value / niceMax) * 100, value > 0 ? 1.5 : 0) : 0;
            const isPeak = i === peakIndex && value > 0;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={d.period}
                tabIndex={0}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(i)}
                onBlur={() => setHoveredIndex(null)}
                className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none"
              >
                {isPeak && (
                  <span className="mb-1 whitespace-nowrap text-[10px] font-bold text-primary-blue-dark">
                    {formatMoney(value)}
                  </span>
                )}

                <div
                  className={`w-full max-w-[24px] rounded-t-[4px] transition-colors duration-150 ${
                    isHovered ? "bg-primary-blue-dark" : "bg-primary-blue"
                  }`}
                  style={{ height: `${pct}%` }}
                />

                {/* Tooltip */}
                <div
                  className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[170px] -translate-x-1/2 rounded-lg border border-border-color bg-white px-3 py-2 text-xs shadow-lg transition-opacity duration-100 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <p className="font-bold text-dark-navy">
                    {formatPeriodLabel(d.period, filter, months)}
                  </p>
                  <p className="mt-0.5 font-extrabold text-primary-blue-dark">
                    {formatFullMoney(value)}
                  </p>
                  <p className="text-[10px] text-text-light">
                    {t("revenue.transactions", { count: d.transactionCount ?? 0 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Baseline */}
      <div className="ml-11 border-t border-slate-200" />

      {/* X-axis */}
      <div className="mt-1.5 flex gap-1 pl-11">
        {data.map((d, i) => (
          <span
            key={d.period}
            className="flex-1 truncate text-center text-[9px] text-slate-400"
          >
            {i % showEveryNth === 0 ? axisLabel(d.period) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appointment row
// ---------------------------------------------------------------------------

function AppointmentRow({ apt, doctorName }: { apt: any; doctorName: string }) {
  const t = useTranslations("dashboard");

  const statusColors: Record<string, string> = {
    SCHEDULED:   "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    COMPLETED:   "bg-emerald-100 text-emerald-700",
    CANCELLED:   "bg-red-100 text-red-700",
    NO_SHOW:     "bg-slate-200 text-slate-600",
  };
  const statusLabels: Record<string, string> = {
    SCHEDULED:   t("appointmentStatus.scheduled"),
    IN_PROGRESS: t("appointmentStatus.inProgress"),
    COMPLETED:   t("appointmentStatus.completed"),
    CANCELLED:   t("appointmentStatus.cancelled"),
    NO_SHOW:     t("appointmentStatus.noShow"),
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-color bg-white px-4 py-3 transition hover:border-primary-blue/40 hover:bg-slate-50/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-blue/10 text-xs font-bold text-primary-blue">
        {apt.startTime?.slice(0, 5) ?? "--:--"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-dark-navy">
          {apt.patient?.firstName} {apt.patient?.lastName}
        </p>
        <p className="truncate text-xs text-text-light">
          {doctorName || t("unknownDoctor")}
        </p>
      </div>
      <span
        className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          statusColors[apt.status] ?? "bg-slate-100 text-slate-600"
        }`}
      >
        {statusLabels[apt.status] ?? apt.status}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Doctor revenue row
// ---------------------------------------------------------------------------

function DoctorRevenueRow({
  item,
}: {
  item: {
    doctorId: string;
    doctorName: string;
    revenue: number;
    transactionCount: number;
    compensationType: "PERCENTAGE" | "SALARY";
    commissionPercentage: number | null;
    estimatedCommissionAmount: number | null;
  };
}) {
  const t = useTranslations("dashboard");

  return (
    <tr className="border-t border-border-color transition hover:bg-slate-50/60">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-dark-navy">
        {item.doctorName}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-light">
        {formatFullMoney(item.revenue)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-light">
        {t("doctorRevenue.transactionsCount", { count: item.transactionCount ?? 0 })}
      </td>
      <td className="px-4 py-3">
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            item.compensationType === "PERCENTAGE"
              ? "bg-blue-100 text-blue-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {item.compensationType === "PERCENTAGE"
            ? `${item.commissionPercentage ?? 0}%`
            : t("doctorRevenue.salaryLabel")}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-dark-navy">
        {item.compensationType === "PERCENTAGE"
          ? formatFullMoney(item.estimatedCommissionAmount ?? 0)
          : "—"}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Payroll doctor row
// ---------------------------------------------------------------------------

function PayrollDoctorRow({
  item,
}: {
  item: {
    doctorId: string;
    doctorName: string;
    compensationType: "PERCENTAGE" | "SALARY";
    salaryAmount: number | null;
    revenue: number;
    commissionPercentage: number | null;
    commissionAmount: number;
    totalCost: number;
  };
}) {
  const t = useTranslations("dashboard");

  return (
    <tr className="border-t border-border-color transition hover:bg-slate-50/60">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-dark-navy">
        {item.doctorName}
      </td>
      <td className="px-4 py-3">
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            item.compensationType === "PERCENTAGE"
              ? "bg-blue-100 text-blue-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {item.compensationType === "PERCENTAGE"
            ? t("payroll.percentageType")
            : t("payroll.salaryType")}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-light">
        {formatFullMoney(item.revenue)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-light">
        {item.compensationType === "PERCENTAGE"
          ? `${item.commissionPercentage ?? 0}%`
          : "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-dark-navy">
        {formatFullMoney(item.totalCost)}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const months = t.raw("months") as string[];

  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const isClinicAdmin = useAuthStore((s) => s.isClinicAdmin());
  const isDoctorUser = useAuthStore((s) => s.isDoctor());

  const isStaffAdmin = isAdmin || isClinicAdmin;
  const currentUserId = (user as any)?.id || (user as any)?._id || "";

  const today = todayYMD();

  // Boshlang'ich holat — darhol "Bugun" oralig'i bilan (null EMAS)
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilterType>("DAY");
  const [fromDate, setFromDate] = useState<string>(() => defaultRangeFor("DAY").from);
  const [toDate, setToDate] = useState<string>(() => defaultRangeFor("DAY").to);
  const [isCustomRange, setIsCustomRange] = useState(false);

  const [statsFromDate, setStatsFromDate] = useState<string>(startOfMonthYMD());
  const [statsToDate, setStatsToDate] = useState<string>(today);

  function handleFilterChange(filter: RevenueFilterType) {
    const range = defaultRangeFor(filter);
    setRevenueFilter(filter);
    setFromDate(range.from);
    setToDate(range.to);
    setIsCustomRange(false);
  }

  function handleCustomFrom(value: string) {
    setFromDate(value);
    setIsCustomRange(true);
  }

  function handleCustomTo(value: string) {
    setToDate(value);
    setIsCustomRange(true);
  }

  const { data: allStaff = [] } = useGetDoctors();

  const doctorNameById = useMemo(() => {
    const map = new Map<string, string>();
    allStaff.forEach((doctor: any) => {
      const id = getDoctorId(doctor);
      if (id) map.set(id, getDoctorFullName(doctor));
    });
    return map;
  }, [allStaff]);

  function resolveDoctorName(apt: any): string {
    const embeddedName = getDoctorFullName(apt?.doctor);
    if (embeddedName) return embeddedName;
    return doctorNameById.get(apt?.doctorId) || "";
  }

  // --------------------------- Queries ---------------------------

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["patients-count"],
    queryFn: async () => {
      const res = await tenantHttp().get(`${ENDPOINTS.patients.list}?size=1`);
      return res.data;
    },
    retry: false,
  });

  const { data: todayApts, isLoading: aptsLoading } = useQuery({
    queryKey: ["appointments-today", today],
    queryFn: async () => {
      const res = await tenantHttp().get(`${ENDPOINTS.appointments.byDate}?date=${today}`);
      return res.data;
    },
    retry: false,
  });

  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ["doctors-count"],
    queryFn: async () => {
      const res = await tenantHttp().get(`${ENDPOINTS.doctors.list}?limit=1`);
      return res.data;
    },
    retry: false,
    enabled: isStaffAdmin,
  });

  // Grafik uchun — tanlangan davr
  const {
    data: revenueData,
    isLoading: revenueLoading,
    isFetching: revenueFetching,
  } = useRevenue({
    fromDate,
    toDate,
    filter: revenueFilter,
    sort: "PERIOD",
    direction: "ASC",
    enabled: isStaffAdmin && Boolean(fromDate && toDate),
  });

  // Kartalar uchun — 3 ta mustaqil summary (staleTime 5 min, kesh ishlaydi)
  const dayRange = useMemo(() => defaultRangeFor("DAY"), []);
  const monthRange = useMemo(() => defaultRangeFor("MONTH"), []);
  const yearRange = useMemo(() => defaultRangeFor("YEAR"), []);

  const daySummary = useRevenue({
    fromDate: dayRange.from,
    toDate: dayRange.to,
    filter: "DAY",
    sort: "PERIOD",
    direction: "ASC",
    enabled: isStaffAdmin,
  });

  const monthSummary = useRevenue({
    fromDate: monthRange.from,
    toDate: monthRange.to,
    filter: "DAY",
    sort: "PERIOD",
    direction: "ASC",
    enabled: isStaffAdmin,
  });

  const yearSummary = useRevenue({
    fromDate: yearRange.from,
    toDate: yearRange.to,
    filter: "MONTH",
    sort: "PERIOD",
    direction: "ASC",
    enabled: isStaffAdmin,
  });

  const { data: doctorRevenueData, isLoading: doctorRevenueLoading } =
    useDoctorRevenueStatistics({
      fromDate: statsFromDate,
      toDate: statsToDate,
      doctorId: isDoctorUser && !isStaffAdmin ? currentUserId : undefined,
      enabled: isStaffAdmin || isDoctorUser,
    });

  const { data: payrollData, isLoading: payrollLoading } = usePayrollSummary({
    fromDate: statsFromDate,
    toDate: statsToDate,
    enabled: isStaffAdmin,
  });

  // --------------------------- Derived ---------------------------

  const revenueList = primaryRevenue(revenueData)?.points ?? [];
  const totalRevenue = primaryRevenue(revenueData)?.totalRevenue ?? 0;
  const totalTxCount = primaryRevenue(revenueData)?.totalTransactionCount ?? 0;

  /**
   * Backend javob shakli har xil bo'lishi mumkin:
   * array | { content } | { appointments } | { data }
   */
  const todayList =
    (Array.isArray(todayApts) && todayApts) ||
    todayApts?.appointments ||
    todayApts?.content ||
    todayApts?.data ||
    [];

  const todayCount = todayList.length;
  const completedCount = todayList.filter((a: any) => a.status === "COMPLETED").length;
  const cancelledCount = todayList.filter((a: any) => a.status === "CANCELLED").length;
  const patientsTotal =
    patients?.totalCount ?? patients?.totalElements ?? patients?.total ?? 0;
  const doctorsTotal =
    doctors?.totalCount ?? doctors?.totalElements ?? doctors?.total ?? 0;

  const doctorRevenueList = doctorRevenueData ?? [];

  const activePeriodLabel =
    revenueFilter === "DAY"
      ? t("revenue.cardToday")
      : revenueFilter === "MONTH"
      ? t("revenue.cardMonth")
      : t("revenue.cardYear");

  // --------------------------- Render ---------------------------

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-dark-navy sm:text-2xl">
          {t("header.title")}
        </h1>
        <p className="mt-1 text-sm text-text-light">
          {t("header.welcome", {
            name: user?.firstName ?? "",
            date: formatDisplayDate(new Date(), months),
          })}
        </p>
      </div>

      {/* Stats overview donut */}
      <StatsDonutChart
        loading={patientsLoading || aptsLoading || (isStaffAdmin && doctorsLoading)}
        segments={[
          { key: "patients", label: t("stats.totalPatients"), value: patientsTotal, color: "#35a8f5", icon: Users },
          { key: "appointments", label: t("stats.todayAppointments"), value: todayCount, color: "#8b5cf6", icon: Calendar },
          { key: "completed", label: t("stats.completed"), value: completedCount, color: "#10b981", icon: CheckCircle2 },
          { key: "cancelled", label: t("stats.cancelled"), value: cancelledCount, color: "#ef4444", icon: XCircle },
          ...(isStaffAdmin
            ? [{ key: "doctors", label: t("stats.doctors"), value: doctorsTotal, color: "#f59e0b", icon: Stethoscope }]
            : []),
        ]}
      />

      {/*
        Revenue + Today appointments
        Qator balandligini FAQAT revenue kartasi belgilaydi.
        Appointments kartasi lg:absolute bilan balandlik hisobidan chiqadi
        va o'sha balandlikni to'ldiradi — ortiqcha qatorlar scroll bo'ladi.
      */}
      <div className={`grid gap-5 sm:gap-6 ${isStaffAdmin ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}>
        {/* Revenue */}
        {isStaffAdmin && (
          <div className="flex flex-col rounded-2xl border border-border-color bg-white p-4 shadow-sm sm:p-5">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-blue/10">
                  <BarChart3 size={17} className="text-primary-blue" />
                </span>
                <h2 className="truncate font-extrabold text-dark-navy">
                  {t("revenue.title")}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DateRangePicker
                  from={fromDate}
                  to={toDate}
                  onFromChange={handleCustomFrom}
                  onToChange={handleCustomTo}
                />

                {isCustomRange && (
                  <button
                    type="button"
                    onClick={() => handleFilterChange("DAY")}
                    className="whitespace-nowrap rounded-lg border border-border-color bg-white px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  >
                    {t("revenue.reset")}
                  </button>
                )}
              </div>
            </div>

            {/* 3 ta bosiladigan davr kartasi */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <RevenuePeriodCard
                label={t("revenue.cardToday")}
                hint={t("revenue.cardTodayHint")}
                amount={primaryRevenue(daySummary.data)?.totalRevenue ?? 0}
                txCount={primaryRevenue(daySummary.data)?.totalTransactionCount ?? 0}
                active={!isCustomRange && revenueFilter === "DAY"}
                loading={daySummary.isLoading}
                accent="#35a8f5"
                onClick={() => handleFilterChange("DAY")}
              />
              <RevenuePeriodCard
                label={t("revenue.cardMonth")}
                hint={t("revenue.cardMonthHint")}
                amount={primaryRevenue(monthSummary.data)?.totalRevenue ?? 0}
                txCount={primaryRevenue(monthSummary.data)?.totalTransactionCount ?? 0}
                active={!isCustomRange && revenueFilter === "MONTH"}
                loading={monthSummary.isLoading}
                accent="#8b5cf6"
                onClick={() => handleFilterChange("MONTH")}
              />
              <RevenuePeriodCard
                label={t("revenue.cardYear")}
                hint={t("revenue.cardYearHint")}
                amount={primaryRevenue(yearSummary.data)?.totalRevenue ?? 0}
                txCount={primaryRevenue(yearSummary.data)?.totalTransactionCount ?? 0}
                active={!isCustomRange && revenueFilter === "YEAR"}
                loading={yearSummary.isLoading}
                accent="#10b981"
                onClick={() => handleFilterChange("YEAR")}
              />
            </div>

            {/* Grafik sarlavhasi */}
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-100 pt-4">
              <p className="text-sm font-bold text-dark-navy">
                {isCustomRange
                  ? t("revenue.chartCustomTitle", { from: fromDate, to: toDate })
                  : t("revenue.chartTitle", { period: activePeriodLabel })}
              </p>

              {!revenueLoading && (
                <p className="text-xs font-semibold text-text-light">
                  {formatFullMoney(totalRevenue)} ·{" "}
                  {t("revenue.transactions", { count: totalTxCount })}
                </p>
              )}
            </div>

            {/* Chart — flex-1 YO'Q, aks holda grafik ostida bo'sh joy cho'ziladi */}
            <div className="mt-4">
              {revenueLoading ? (
                <div className="flex h-44 items-end gap-1.5 pl-11">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 animate-pulse rounded-t bg-slate-100"
                      style={{ height: `${25 + ((i * 37) % 60)}%` }}
                    />
                  ))}
                </div>
              ) : !revenueList.length ? (
                <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
                  <BarChart3 size={30} className="opacity-30" />
                  <p className="text-sm font-medium">{tCommon("feedback.noData")}</p>
                </div>
              ) : (
                <div
                  className={`transition-opacity duration-200 ${
                    revenueFetching ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <RevenueChart data={revenueList} filter={revenueFilter} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today appointments */}
        <div className={`relative min-h-[320px] ${isStaffAdmin ? "lg:min-h-0" : ""}`}>
          <div
            className={`flex flex-col rounded-2xl border border-border-color bg-white p-4 shadow-sm sm:p-5 ${
              isStaffAdmin ? "lg:absolute lg:inset-0" : ""
            }`}
          >
            <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-blue/10">
                  <Clock size={17} className="text-primary-blue" />
                </span>
                <h2 className="truncate font-extrabold text-dark-navy">
                  {t("todayAppointments.title")}
                </h2>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-primary-blue/10 px-3 py-1 text-xs font-bold text-primary-blue">
                {t("todayAppointments.count", { count: todayCount })}
              </span>
            </div>

            {aptsLoading ? (
              <div className="min-h-0 flex-1 space-y-2 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : !todayList.length ? (
              <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
                <Calendar size={30} className="opacity-30" />
                <p className="text-sm font-medium">{t("todayAppointments.empty")}</p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {todayList.map((apt: any, index: number) => (
                  <AppointmentRow
                    key={apt.id ?? `${apt.startTime}-${index}`}
                    apt={apt}
                    doctorName={resolveDoctorName(apt)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Revenue / Payroll sana filtri */}
      {(isStaffAdmin || isDoctorUser) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-color bg-white p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-blue/10">
              <TrendingUp size={17} className="text-primary-blue" />
            </span>
            <h2 className="truncate font-extrabold text-dark-navy">
              {t("doctorPayments.title")}
            </h2>
          </div>

          <DateRangePicker
            from={statsFromDate}
            to={statsToDate}
            onFromChange={setStatsFromDate}
            onToChange={setStatsToDate}
          />
        </div>
      )}

      {/* Payroll Summary */}
      {isStaffAdmin && (
        <div className="rounded-2xl border border-border-color bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Wallet size={17} className="text-emerald-600" />
            </span>
            <h2 className="font-extrabold text-dark-navy">{t("payroll.title")}</h2>
          </div>

          {payrollLoading ? (
            <DentalLoader fullScreen={false} text={tCommon("feedback.loading")} />
          ) : !payrollData ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
              <Wallet size={30} className="opacity-30" />
              <p className="text-sm font-medium">{tCommon("feedback.noData")}</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="mb-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    {t("payroll.monthlyExpense")}
                  </p>
                  <p className="mt-1.5 text-lg font-extrabold text-dark-navy sm:text-xl">
                    {formatFullMoney(payrollData.totalSalaryExpense)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    {t("payroll.commissionExpense")}
                  </p>
                  <p className="mt-1.5 text-lg font-extrabold text-dark-navy sm:text-xl">
                    {formatFullMoney(payrollData.totalCommissionExpense)}
                  </p>
                </div>
                <div className="rounded-xl border border-primary-blue/20 bg-primary-blue/10 p-4">
                  <p className="text-xs font-semibold text-primary-blue-dark">
                    {t("payroll.totalExpense")}
                  </p>
                  <p className="mt-1.5 text-lg font-extrabold text-primary-blue-dark sm:text-xl">
                    {formatFullMoney(payrollData.totalExpense)}
                  </p>
                </div>
              </div>

              {/* Doctor details */}
              {payrollData.doctorDetails.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-sm font-bold text-dark-navy">
                    {t("payroll.doctorsTableTitle")}
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-border-color">
                    <table className="w-full min-w-[600px] border-collapse text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          {["name", "type", "revenue", "percent", "totalCost"].map((col) => (
                            <th
                              key={col}
                              className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                              {t(`payroll.columns.${col}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payrollData.doctorDetails.map((item, index) => (
                          <PayrollDoctorRow
                            key={item.doctorId || `${item.doctorName}-${index}`}
                            item={item}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Staff details */}
              {payrollData.staffDetails.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-bold text-dark-navy">
                    {t("payroll.staffTableTitle")}
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-border-color">
                    <table className="w-full min-w-[500px] border-collapse text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          {["name", "role", "salary"].map((col) => (
                            <th
                              key={col}
                              className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                              {t(`payroll.columns.${col}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payrollData.staffDetails.map((item, index) => (
                          <tr
                            key={
                              item.staffId || (item as any).id || `${item.staffName}-${index}`
                            }
                            className="border-t border-border-color transition hover:bg-slate-50/60"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-dark-navy">
                              {item.staffName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-light">
                              {item.role}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-dark-navy">
                              {formatFullMoney(item.totalCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Doctor Revenue Statistics */}
      {(isStaffAdmin || isDoctorUser) && (
        <div className="rounded-2xl border border-border-color bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Percent size={17} className="text-amber-600" />
            </span>
            <h2 className="font-extrabold text-dark-navy">
              {isDoctorUser && !isStaffAdmin
                ? t("doctorRevenue.myTitle")
                : t("doctorRevenue.allTitle")}
            </h2>
          </div>

          {doctorRevenueLoading ? (
            <DentalLoader fullScreen={false} text={tCommon("feedback.loading")} />
          ) : !doctorRevenueList.length ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
              <Percent size={30} className="opacity-30" />
              <p className="text-sm font-medium">{tCommon("feedback.noData")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-color">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "doctor",
                      "revenue",
                      "transactions",
                      "compensation",
                      "commissionAmount",
                    ].map((col) => (
                      <th
                        key={col}
                        className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {t(`doctorRevenue.columns.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doctorRevenueList.map((item, index) => (
                    <DoctorRevenueRow
                      key={item.doctorId || `${item.doctorName}-${index}`}
                      item={item}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
