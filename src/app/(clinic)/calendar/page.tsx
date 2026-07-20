"use client";

/**
 * File: src/app/(clinic)/calendar/page.tsx
 *
 * Oy va hafta ko'rinishi almashtiriladigan calendar.
 * Kunga bosilganda modal ochiladi — o'sha kundagi barcha appointmentlar
 * to'liq ko'rinishda (bemor, shifokor, vaqt, izoh, status).
 * Header'da sana tanlash (date picker) orqali istalgan sanaga o'tish mumkin.
 *
 * Rol bo'yicha ko'rinish:
 * - DOCTOR: faqat o'z appointmentlarini ko'radi, doctor filter yashirin
 *   (boshqa doctorni tanlab bo'lmaydi).
 * - CLINIC_ADMIN/ADMIN/RECEPTIONIST/ASSISTANT: butun klinika calendarini
 *   ko'radi, doctor filter (barcha shifokorlar / bittasi) mavjud.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  LayoutList,
  Stethoscope,
  Users,
  X,
  Clock,
  StickyNote,
  UserRound,
} from "lucide-react";

import { tenantHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { useAuthStore } from "@/src/store/auth.store";
import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";
import { Role } from "@/src/lib/enums/enums.types";
import DentalLoader from "@/src/components/ui/DentalLoader";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type CalendarView = "MONTH" | "WEEK";

const WEEKDAY_LABELS = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"];
const MONTH_LABELS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const HOUR_HEIGHT = 64; // px

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string; badge: string }> = {
  SCHEDULED:   { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    label: "Kutilmoqda", badge: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Jarayonda",  badge: "bg-amber-100 text-amber-700" },
  COMPLETED:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Bajarildi",  badge: "bg-emerald-100 text-emerald-700" },
  CANCELLED:   { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     label: "Bekor",      badge: "bg-red-100 text-red-700" },
  NO_SHOW:     { bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400",   label: "Kelmadi",    badge: "bg-slate-200 text-slate-600" },
};

const DOCTOR_ACCENTS = [
  { border: "border-l-blue-400",    chip: "bg-blue-500" },
  { border: "border-l-violet-400",  chip: "bg-violet-500" },
  { border: "border-l-emerald-400", chip: "bg-emerald-500" },
  { border: "border-l-amber-400",   chip: "bg-amber-500" },
  { border: "border-l-rose-400",    chip: "bg-rose-500" },
  { border: "border-l-cyan-400",    chip: "bg-cyan-500" },
  { border: "border-l-fuchsia-400", chip: "bg-fuchsia-500" },
  { border: "border-l-lime-500",    chip: "bg-lime-500" },
];

// ---------------------------------------------------------------------------
// Date helpers (no date-fns — loyihaning umumiy uslubiga mos)
// ---------------------------------------------------------------------------

function padZ(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${padZ(d.getMonth() + 1)}-${padZ(d.getDate())}`;
}

function parseYMD(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return toYMD(a) === toYMD(b);
}

function startOfWeekMonday(d: Date) {
  const day = d.getDay(); // 0 = Yak
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function getMonthMatrix(anchor: Date): Date[][] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeekMonday(firstOfMonth);

  const weeks: Date[][] = [];
  let cursor = gridStart;

  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);

    const lastDayOfWeek = week[6];
    if (lastDayOfWeek.getMonth() !== anchor.getMonth() && w >= 4) break;
  }

  return weeks;
}

function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeekMonday(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function timeToMinutes(time?: string): number {
  if (!time) return DAY_START_HOUR * 60;
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatTimeShort(time?: string) {
  if (!time) return "--:--";
  return time.slice(0, 5);
}

function formatFullDate(d: Date) {
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}, ${WEEKDAY_LABELS[(d.getDay() + 6) % 7]}`;
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

function getDoctorAccent(doctorId: string) {
  let hash = 0;
  for (let i = 0; i < doctorId.length; i++) {
    hash = (hash * 31 + doctorId.charCodeAt(i)) >>> 0;
  }
  return DOCTOR_ACCENTS[hash % DOCTOR_ACCENTS.length];
}

// ---------------------------------------------------------------------------
// Event chip — oy ko'rinishi uchun (kichik, kompakt)
// ---------------------------------------------------------------------------

function MonthEventChip({ apt, doctorName }: { apt: any; doctorName: string }) {
  const status = STATUS_STYLES[apt.status] ?? STATUS_STYLES.SCHEDULED;
  const accent = getDoctorAccent(apt.doctorId || "");
  const patientName = `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim();

  return (
    <div
      className={`rounded-md border-l-4 ${accent.border} ${status.bg} px-1.5 py-1 text-[11px] leading-tight`}
      title={`${formatTimeShort(apt.startTime)} — ${patientName}${apt.notes ? ` · ${apt.notes}` : ""}`}
    >
      <p className={`truncate font-bold ${status.text}`}>
        {formatTimeShort(apt.startTime)} {patientName || "Bemor"}
      </p>
      {doctorName && (
        <p className="truncate text-[10px] text-slate-500">{doctorName}</p>
      )}
      {apt.notes && (
        <p className="truncate text-[10px] text-slate-400">{apt.notes}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event block — hafta ko'rinishi uchun (vaqt bo'yicha joylashgan)
// ---------------------------------------------------------------------------

function WeekEventBlock({
  apt,
  doctorName,
  onClick,
}: {
  apt: any;
  doctorName: string;
  onClick: () => void;
}) {
  const status = STATUS_STYLES[apt.status] ?? STATUS_STYLES.SCHEDULED;
  const accent = getDoctorAccent(apt.doctorId || "");
  const patientName = `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim();

  const startMinutes = timeToMinutes(apt.startTime);
  const endMinutes = apt.endTime ? timeToMinutes(apt.endTime) : startMinutes + 30;
  const dayStartMinutes = DAY_START_HOUR * 60;

  const top = Math.max(0, ((startMinutes - dayStartMinutes) / 60) * HOUR_HEIGHT);
  const height = Math.max(28, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute left-1 right-1 overflow-hidden rounded-lg border-l-4 ${accent.border} ${status.bg} px-2 py-1 text-left shadow-sm transition hover:shadow-md`}
      style={{ top, height }}
      title={`${formatTimeShort(apt.startTime)}–${formatTimeShort(apt.endTime)} · ${patientName}${apt.notes ? ` · ${apt.notes}` : ""}`}
    >
      <p className={`truncate text-[11px] font-bold ${status.text}`}>
        {formatTimeShort(apt.startTime)} {patientName || "Bemor"}
      </p>
      {doctorName && (
        <p className="truncate text-[10px] text-slate-500">{doctorName}</p>
      )}
      {apt.notes && height > 44 && (
        <p className="truncate text-[10px] text-slate-400">{apt.notes}</p>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Day detail modal — kunga bosilganda ochiladi
// ---------------------------------------------------------------------------

function DayDetailModal({
  date,
  appointments,
  resolveDoctorName,
  onClose,
}: {
  date: Date;
  appointments: any[];
  resolveDoctorName: (apt: any) => string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-color bg-gradient-to-r from-[#35a8f5]/10 to-violet-500/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#35a8f5] shadow-sm">
              <CalendarRange size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-dark-navy">{formatFullDate(date)}</h2>
              <p className="text-xs text-text-light">
                {appointments.length} ta qabul
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/60"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(85vh-76px)] overflow-y-auto p-6">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <CalendarRange size={32} className="opacity-30" />
              <p className="text-sm">Bu kunda qabul yo'q</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => {
                const status = STATUS_STYLES[apt.status] ?? STATUS_STYLES.SCHEDULED;
                const accent = getDoctorAccent(apt.doctorId || "");
                const patientName = `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim();
                const doctorName = resolveDoctorName(apt);

                return (
                  <div
                    key={apt.id}
                    className={`rounded-xl border-l-4 ${accent.border} border border-border-color bg-white p-4 shadow-sm`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#35a8f5]/10 text-xs font-bold text-[#35a8f5]">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-dark-navy">
                            {formatTimeShort(apt.startTime)}
                            {apt.endTime ? ` – ${formatTimeShort(apt.endTime)}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <UserRound size={15} className="text-slate-400" />
                      <p className="text-sm font-bold text-dark-navy">
                        {patientName || "Bemor noma'lum"}
                      </p>
                      {apt.patient?.phone && (
                        <span className="text-xs text-slate-400">· {apt.patient.phone}</span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <Stethoscope size={15} className="text-slate-400" />
                      <p className="text-sm text-slate-600">
                        {doctorName || "Shifokor noma'lum"}
                      </p>
                    </div>

                    {apt.notes && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                        <StickyNote size={14} className="mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-sm text-slate-600">{apt.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const isDoctorUser = useAuthStore((s) => s.isDoctor());
  const currentUserId = (user as any)?.id || (user as any)?._id || "";
  const currentUserName =
    (user as any)?.fullName ||
    `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim();

  const [view, setView] = useState<CalendarView>("MONTH");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());

  // DOCTOR uchun doctorFilter har doim o'zi bilan qulflangan va o'zgartirilmaydi.
  // Boshqa rollar uchun "ALL" dan boshlanadi va tanlash imkoniyati bor.
  const [doctorFilter, setDoctorFilter] = useState<string>(
    isDoctorUser ? currentUserId : "ALL"
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: allStaff = [] } = useGetDoctors();
  const doctorOptions = allStaff.filter((d: any) => d.roles?.includes(Role.DOCTOR));

  const doctorNameById = useMemo(() => {
    const map = new Map<string, string>();
    allStaff.forEach((doctor: any) => {
      const id = getDoctorId(doctor);
      if (id) map.set(id, getDoctorFullName(doctor));
    });
    return map;
  }, [allStaff]);

  function resolveDoctorName(apt: any): string {
    const embedded = getDoctorFullName(apt?.doctor);
    if (embedded) return embedded;
    return doctorNameById.get(apt?.doctorId) || "";
  }

  const { data: rawAppointments, isLoading } = useQuery({
    queryKey: ["appointments-all"],
    queryFn: async () => {
      const res = await tenantHttp().get(ENDPOINTS.appointments.list);
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const allAppointments: any[] =
    (Array.isArray(rawAppointments) && rawAppointments) ||
    rawAppointments?.appointments ||
    rawAppointments?.content ||
    rawAppointments?.data ||
    [];

  // DOCTOR uchun har doim faqat o'zinikiga filtrlanadi — foydalanuvchi
  // hech qanday tanlov orqali buni chetlab o'ta olmaydi (dropdown yashirin).
  const effectiveDoctorFilter = isDoctorUser ? currentUserId : doctorFilter;

  const filteredAppointments = useMemo(() => {
    if (effectiveDoctorFilter === "ALL") return allAppointments;
    return allAppointments.filter((a) => a.doctorId === effectiveDoctorFilter);
  }, [allAppointments, effectiveDoctorFilter]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    filteredAppointments.forEach((apt) => {
      const key = apt.appointmentDate;
      if (!key) return;
      const list = map.get(key) || [];
      list.push(apt);
      map.set(key, list);
    });
    map.forEach((list) => list.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)));
    return map;
  }, [filteredAppointments]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function goToday() {
    const now = new Date();
    setAnchorDate(now);
  }

  function goPrev() {
    setAnchorDate((prev) =>
      view === "MONTH"
        ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
        : addDays(prev, -7)
    );
  }

  function goNext() {
    setAnchorDate((prev) =>
      view === "MONTH"
        ? new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
        : addDays(prev, 7)
    );
  }

  function handleDatePicked(value: string) {
    if (!value) return;
    const picked = parseYMD(value);
    setAnchorDate(picked);
  }

  function openDay(date: Date) {
    setSelectedDate(date);
  }

  const monthMatrix = useMemo(() => getMonthMatrix(anchorDate), [anchorDate]);
  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    []
  );

  const today = new Date();

  const headerLabel =
    view === "MONTH"
      ? `${MONTH_LABELS[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`
      : `${weekDays[0].getDate()} ${MONTH_LABELS[weekDays[0].getMonth()]} — ${weekDays[6].getDate()} ${MONTH_LABELS[weekDays[6].getMonth()]}, ${weekDays[6].getFullYear()}`;

  const selectedDayAppointments = selectedDate
    ? appointmentsByDate.get(toYMD(selectedDate)) || []
    : [];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border-color bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#35a8f5] to-violet-500 text-white shadow-sm">
            <CalendarRange size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-dark-navy">Calendar</h1>
            <p className="text-sm text-text-light">
              {headerLabel}
              {isDoctorUser && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Faqat sizniki
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date picker */}
          <input
            type="date"
            value={toYMD(anchorDate)}
            onChange={(e) => handleDatePicked(e.target.value)}
            className="rounded-xl border border-border-color bg-white px-3 py-2 text-sm font-semibold text-dark-navy outline-none focus:border-[#35a8f5]"
          />

          {/* Doctor filter — DOCTOR uchun yashirin, faqat o'zi bilan qulflangan */}
          {isDoctorUser ? (
            <div className="flex items-center gap-2 rounded-xl border border-border-color bg-slate-50 px-3 py-2">
              <Stethoscope size={14} className="text-[#35a8f5]" />
              <span className="text-sm font-semibold text-dark-navy">
                {currentUserName || "Siz"}
              </span>
            </div>
          ) : (
            <div className="relative">
              <Stethoscope size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="rounded-xl border border-border-color bg-white py-2 pl-8 pr-3 text-sm font-semibold text-dark-navy outline-none focus:border-[#35a8f5]"
              >
                <option value="ALL">Barcha shifokorlar</option>
                {doctorOptions.map((d: any) => {
                  const id = getDoctorId(d);
                  return (
                    <option key={id} value={id}>
                      {getDoctorFullName(d)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-xl border border-border-color text-xs font-bold">
            <button
              type="button"
              onClick={() => setView("MONTH")}
              className={`flex items-center gap-1.5 px-3 py-2 transition ${
                view === "MONTH" ? "bg-[#35a8f5] text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Grid3x3 size={14} /> Oy
            </button>
            <button
              type="button"
              onClick={() => setView("WEEK")}
              className={`flex items-center gap-1.5 px-3 py-2 transition ${
                view === "WEEK" ? "bg-[#35a8f5] text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <LayoutList size={14} /> Hafta
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-color text-slate-500 transition hover:border-[#35a8f5] hover:text-[#35a8f5]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-xl border border-border-color px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[#35a8f5] hover:text-[#35a8f5]"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-color text-slate-500 transition hover:border-[#35a8f5] hover:text-[#35a8f5]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-color bg-white px-4 py-3 shadow-sm">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Users size={14} /> Holat:
        </span>
        {Object.entries(STATUS_STYLES).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border-color bg-white">
          <DentalLoader fullScreen={false} text="Calendar yuklanmoqda..." />
        </div>
      ) : view === "MONTH" ? (
        // ====== MONTH VIEW ======
        <div className="overflow-hidden rounded-2xl border border-border-color bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-border-color bg-slate-50">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthMatrix.flat().map((date, idx) => {
              const inCurrentMonth = date.getMonth() === anchorDate.getMonth();
              const isToday = isSameDay(date, today);
              const dayAppointments = appointmentsByDate.get(toYMD(date)) || [];

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openDay(date)}
                  className={`min-h-[130px] border-b border-r border-border-color p-2 text-left transition last:border-r-0 hover:bg-blue-50/40 ${
                    inCurrentMonth ? "bg-white" : "bg-slate-50/60"
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? "bg-[#35a8f5] text-white"
                          : inCurrentMonth
                            ? "text-dark-navy"
                            : "text-slate-300"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  <div className="max-h-[92px] space-y-1 overflow-y-auto pr-0.5">
                    {dayAppointments.map((apt) => (
                      <MonthEventChip key={apt.id} apt={apt} doctorName={resolveDoctorName(apt)} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // ====== WEEK VIEW ======
        <div className="overflow-hidden rounded-2xl border border-border-color bg-white shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border-color bg-slate-50">
            <div />
            {weekDays.map((date) => {
              const isToday = isSameDay(date, today);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => openDay(date)}
                  className="border-l border-border-color px-2 py-2.5 text-center transition hover:bg-blue-50/40"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {WEEKDAY_LABELS[(date.getDay() + 6) % 7]}
                  </p>
                  <p
                    className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${
                      isToday ? "bg-[#35a8f5] text-white" : "text-dark-navy"
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] overflow-x-auto">
            {/* Hour labels */}
            <div className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-end border-r border-border-color pr-2 text-[10px] font-semibold text-slate-400"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {padZ(h)}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((date) => {
              const dayAppointments = appointmentsByDate.get(toYMD(date)) || [];
              return (
                <div
                  key={date.toISOString()}
                  className="relative border-l border-border-color"
                  style={{ height: HOUR_HEIGHT * hours.length }}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-b border-dashed border-slate-100"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}

                  {dayAppointments.map((apt) => (
                    <WeekEventBlock
                      key={apt.id}
                      apt={apt}
                      doctorName={resolveDoctorName(apt)}
                      onClick={() => openDay(date)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day detail modal */}
      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          appointments={selectedDayAppointments}
          resolveDoctorName={resolveDoctorName}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}