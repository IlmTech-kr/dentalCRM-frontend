"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Edit2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import DentalLoader, { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";

import {
  useCreateDoctorSchedule,
  useCreateWeeklyDoctorSchedule,
  useDeleteDoctorSchedule,
  useGetDoctorSchedules,
  useUpdateScheduleByDay,
} from "@/src/features/doctors/hooks/useDoctorSchedules";
import { useGetDoctors } from "@/src/features/doctors/hooks/useDoctors";

import type {
  DoctorSchedule,
  DoctorSchedulePayload,
  WeeklyDoctorSchedulePayload,
} from "@/src/types/doctor-schedule.types";

import { DayOfWeek } from "@/src/lib/enums/enums.types";
import { getApiErrorMessage } from "@/src/lib/api/http";
import { useToast } from "@/src/lib/hooks/Usetoast";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: DayOfWeek.MONDAY,    label: "Monday",    short: "Mon" },
  { value: DayOfWeek.TUESDAY,   label: "Tuesday",   short: "Tue" },
  { value: DayOfWeek.WEDNESDAY, label: "Wednesday", short: "Wed" },
  { value: DayOfWeek.THURSDAY,  label: "Thursday",  short: "Thu" },
  { value: DayOfWeek.FRIDAY,    label: "Friday",    short: "Fri" },
  { value: DayOfWeek.SATURDAY,  label: "Saturday",  short: "Sat" },
  { value: DayOfWeek.SUNDAY,    label: "Sunday",    short: "Sun" },
];

const CALENDAR_HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00–18:00
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90];

const AVATAR_PALETTE = [
  { bg: "bg-blue-100",   text: "text-blue-800"   },
  { bg: "bg-teal-100",   text: "text-teal-800"   },
  { bg: "bg-pink-100",   text: "text-pink-800"   },
  { bg: "bg-amber-100",  text: "text-amber-800"  },
  { bg: "bg-purple-100", text: "text-purple-800" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PageView = "cards" | "calendar";

type CreateMode = "WEEKLY" | "DAILY";

type DayRow = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
};

type FlatDoctorSchedule = DoctorSchedule & { doctorName?: string };

interface DoctorScheduleGroup {
  doctorId: string;
  doctorName: string;
  paletteIdx: number;
  schedules: FlatDoctorSchedule[];
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function normalizeScheduleTime(time?: string | null): string {
  if (!time) return "";
  const value = String(time).trim();
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return value;
}

function getDoctorId(doctor: any): string {
  return doctor?.id ?? doctor?._id ?? "";
}

function getDoctorName(doctor: any): string {
  if (!doctor) return "";
  if (doctor.fullName) return doctor.fullName;
  if (doctor.name) return doctor.name;
  return `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
}

function getDoctorInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDayShort(day?: DayOfWeek | string): string {
  return DAYS.find((d) => d.value === day)?.short ?? String(day ?? "-");
}

function getDayLabel(day: DayOfWeek | string, t: ReturnType<typeof useTranslations>): string {
  return t(`days.${String(day).toLowerCase()}`);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Berilgan doctorId uchun mavjud schedule qatorlaridan (flat, useGetDoctorSchedules
 * natijasi) 7 kunlik DayRow[] quradi. Mavjud bo'lmagan kunlar active:false bilan
 * default vaqt (09:00–18:00) bilan to'ldiriladi. EDIT rejimida ishlatiladi.
 */
function buildDayRowsForDoctor(schedules: FlatDoctorSchedule[], doctorId: string): DayRow[] {
  const byDay = new Map<string, FlatDoctorSchedule>();
  schedules
    .filter((s) => s.doctorId === doctorId)
    .forEach((s) => {
      if (s.dayOfWeek) byDay.set(s.dayOfWeek, s);
    });

  return DAYS.map((d) => {
    const existing = byDay.get(d.value);
    if (existing) {
      return {
        dayOfWeek: d.value,
        startTime: normalizeScheduleTime(existing.startTime) || "09:00",
        endTime: normalizeScheduleTime(existing.endTime) || "18:00",
        active: Boolean(existing.active),
      };
    }
    return { dayOfWeek: d.value, startTime: "09:00", endTime: "18:00", active: false };
  });
}

function buildEmptyDayRows(): DayRow[] {
  return DAYS.map((d) => ({ dayOfWeek: d.value, startTime: "09:00", endTime: "18:00", active: false }));
}

/**
 * Har bir kun-qatorida (useGetDoctorSchedules natijasi) parent schedule
 * hujjatining id'si `id`/`_id` sifatida takrorlanadi (service darajasida
 * shunday normalizatsiya qilingan). Shuning uchun doctorId bo'yicha birinchi
 * qatordan schedule hujjatining ID'sini olsa bo'ladi — DELETE shu ID bilan
 * ishlaydi (butun haftalik hujjatni o'chiradi).
 */
function getScheduleIdForDoctor(schedules: FlatDoctorSchedule[], doctorId: string): string {
  const row = schedules.find((s) => s.doctorId === doctorId) as any;
  if (!row) return "";
  return row.id || row._id || "";
}

// ─── Doctor card ──────────────────────────────────────────────────────────────

function DoctorCard({
  group,
  onView,
  onEditSchedule,
  onDeleteSchedule,
  isDeleting,
}: {
  group: DoctorScheduleGroup;
  onView: () => void;
  onEditSchedule: () => void;
  onDeleteSchedule: () => void;
  isDeleting?: boolean;
}) {
  const t = useTranslations("doctors.schedule");
  const { bg, text } = AVATAR_PALETTE[group.paletteIdx % AVATAR_PALETTE.length];
  const activeDays = group.schedules.filter((s) => s.active);
  const uniqueActiveDays = [...new Set(activeDays.map((s) => s.dayOfWeek))];

  return (
    <div className="flex flex-col rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${bg} ${text}`}
        >
          {getDoctorInitials(group.doctorName)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-extrabold text-slate-900">{group.doctorName}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-1.5">
        {DAYS.map((d) => {
          const active = uniqueActiveDays.includes(d.value);
          return (
            <div
              key={d.value}
              title={getDayLabel(d.value, t)}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-extrabold transition ${
                active ? `${bg} ${text}` : "bg-slate-100 text-slate-400"
              }`}
            >
              {d.short[0]}
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("daysPerWeek", { count: uniqueActiveDays.length })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {t("activeCount", { count: activeDays.length })}
        </span>
      </div>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-blue px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-blue-dark"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {t("viewSchedule")}
        </button>
        <button
          type="button"
          onClick={onEditSchedule}
          title={t("editScheduleTitle")}
          className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDeleteSchedule}
          disabled={isDeleting}
          title={t("deleteScheduleTitle")}
          className="flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Weekly calendar view ─────────────────────────────────────────────────────

function WeeklyCalendar({
  group,
  onBack,
  onEditSchedule,
  onDeleteSchedule,
  isDeleting,
  showBackButton = true,
}: {
  group: DoctorScheduleGroup;
  onBack: () => void;
  onEditSchedule: () => void;
  onDeleteSchedule: () => void;
  isDeleting?: boolean;
  showBackButton?: boolean;
}) {
  const t = useTranslations("doctors.schedule");
  const { bg, text } = AVATAR_PALETTE[group.paletteIdx % AVATAR_PALETTE.length];

  const byDay = useMemo(() => {
    const map = new Map<DayOfWeek, FlatDoctorSchedule>();
    group.schedules.forEach((s) => {
      if (s.dayOfWeek && s.active) map.set(s.dayOfWeek as DayOfWeek, s);
    });
    return map;
  }, [group.schedules]);

  const ROW_H = 52;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("allDoctors")}
            </button>
          )}

          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold ${bg} ${text}`}
            >
              {getDoctorInitials(group.doctorName)}
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">{group.doctorName}</p>
              <p className="text-xs text-slate-500">{t("weeklyWorkSchedule")}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEditSchedule}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-blue-dark"
          >
            <Edit2 className="h-4 w-4" />
            {t("editSchedule")}
          </button>
          <button
            type="button"
            onClick={onDeleteSchedule}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {t("deleteSchedule")}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: t("workDays"), value: byDay.size, color: "text-slate-900" },
          {
            label: t("activeSlots"),
            value: group.schedules.filter((s) => s.active).length,
            color: "text-emerald-600",
          },
          {
            label: t("hoursPerWeek"),
            value: `${group.schedules.reduce((acc, s) => {
              if (!s.active) return acc;
              const sh = parseInt(normalizeScheduleTime(s.startTime));
              const eh = parseInt(normalizeScheduleTime(s.endTime));
              return acc + (isNaN(sh) || isNaN(eh) ? 0 : eh - sh);
            }, 0)}h`,
            color: "text-blue-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">{stat.label}</p>
            <p className={`mt-1.5 text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div style={{ minWidth: 560 }}>
          <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
            <div />
            {DAYS.map((d) => {
              const hasSlots = byDay.has(d.value);
              return (
                <div
                  key={d.value}
                  className={`py-3 text-center text-xs font-extrabold uppercase tracking-wider ${
                    hasSlots ? "text-primary-blue" : "text-slate-400"
                  }`}
                >
                  {d.short}
                </div>
              );
            })}
          </div>

          <div className="relative">
            {CALENDAR_HOURS.map((hour) => (
              <div
                key={hour}
                className="grid border-b border-slate-50 last:border-0"
                style={{ gridTemplateColumns: `52px repeat(7, 1fr)`, height: ROW_H }}
              >
                <div className="flex items-start justify-end pr-3 pt-1.5">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {pad2(hour)}:00
                  </span>
                </div>

                {DAYS.map((d) => {
                  const slot = byDay.get(d.value);
                  const isWorkDay = Boolean(slot);
                  return (
                    <div
                      key={d.value}
                      className={`relative border-l border-slate-50 ${!isWorkDay ? "bg-slate-50/60" : ""}`}
                    >
                      {slot &&
                        (() => {
                          const start = normalizeScheduleTime(slot.startTime);
                          const end = normalizeScheduleTime(slot.endTime);
                          const startH = parseInt(start);
                          const endH = parseInt(end);
                          if (isNaN(startH) || hour !== startH) return null;
                          const spanH = endH - startH;
                          return (
                            <div
                              className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border-l-2 border-primary-blue bg-primary-blue/5"
                              style={{ top: 2, height: spanH * ROW_H - 4 }}
                            >
                              <div className="flex h-full flex-col justify-between p-2">
                                <p className="text-[10px] font-extrabold text-primary-blue">
                                  {start} – {end}
                                </p>
                                <span className="w-fit rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                                  {t("activeBadge")}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-l-2 border-primary-blue bg-primary-blue/5" />
          {t("workHours")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-50" />
          {t("dayOff")}
        </span>
      </div>
    </div>
  );
}

// ─── Week editor modal (EDIT: har kuni alohida / CREATE: Weekly yoki Daily) ──

interface WeekEditorModalProps {
  open: boolean;
  doctorId: string;
  doctors: any[];
  isDoctorLocked: boolean;
  onDoctorChange: (doctorId: string) => void;
  hasExistingSchedule: boolean;

  // EDIT mode (mavjud schedule) — har kuni alohida qator
  dayRows: DayRow[];
  onChangeDayRows: (rows: DayRow[]) => void;

  // CREATE mode (schedule hali yo'q) — Weekly yoki Daily
  createMode: CreateMode;
  onCreateModeChange: (mode: CreateMode) => void;
  createStartTime: string;
  createEndTime: string;
  onCreateStartTimeChange: (v: string) => void;
  onCreateEndTimeChange: (v: string) => void;
  createSelectedDays: DayOfWeek[];
  onToggleCreateDay: (day: DayOfWeek) => void;
  createSlotDuration: number;
  onCreateSlotDurationChange: (v: number) => void;

  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onDeleteSchedule: () => void;
  isDeleting: boolean;
}

function WeekEditorModal({
  open,
  doctorId,
  doctors,
  isDoctorLocked,
  onDoctorChange,
  hasExistingSchedule,
  dayRows,
  onChangeDayRows,
  createMode,
  onCreateModeChange,
  createStartTime,
  createEndTime,
  onCreateStartTimeChange,
  onCreateEndTimeChange,
  createSelectedDays,
  onToggleCreateDay,
  createSlotDuration,
  onCreateSlotDurationChange,
  isSubmitting,
  onClose,
  onSubmit,
  onDeleteSchedule,
  isDeleting,
}: WeekEditorModalProps) {
  const t = useTranslations("doctors.schedule");

  if (!open) return null;

  function updateRow(index: number, patch: Partial<DayRow>) {
    const next = dayRows.slice();
    next[index] = { ...next[index], ...patch };
    onChangeDayRows(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

      <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="border-b border-slate-100 bg-primary-blue/5 px-4 py-6 sm:px-6 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
                {hasExistingSchedule ? t("modal.editTitle") : t("modal.createTitle")}
              </h2>
              <p className="mt-2 break-words text-sm font-medium text-slate-600">
                {hasExistingSchedule
                  ? t("modal.editHint")
                  : t("modal.createHint")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="max-h-[calc(92vh-150px)] space-y-6 overflow-y-auto px-4 py-7 sm:px-6">
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              {t("modal.doctorLabel")} <span className="text-red-500">*</span>
            </label>
            <select
              value={doctorId}
              disabled={isDoctorLocked}
              onChange={(e) => onDoctorChange(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">{t("modal.selectDoctor")}</option>
              {doctors.map((doctor) => {
                const id = getDoctorId(doctor);
                const name = getDoctorName(doctor);
                return (
                  <option key={id} value={id}>
                    {name || id}
                  </option>
                );
              })}
            </select>
            {doctors.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-amber-600">
                {t("modal.noDoctorsFound")}
              </p>
            )}
          </div>

          {hasExistingSchedule ? (
            // ── EDIT: har kuni alohida qator (mavjud holat) ──
            <div className="space-y-2.5">
              {DAYS.map((day, index) => {
                const row = dayRows[index];
                return (
                  <div
                    key={day.value}
                    className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-3 transition ${
                      row.active ? "border-primary-blue/20 bg-primary-blue/10" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={row.active}
                        onChange={(e) => updateRow(index, { active: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                      />
                      <span className="text-sm font-extrabold text-slate-900">{getDayLabel(day.value, t)}</span>
                    </label>

                    <input
                      type="time"
                      value={row.startTime}
                      disabled={!row.active}
                      onChange={(e) => updateRow(index, { startTime: normalizeScheduleTime(e.target.value) })}
                      className="min-w-[120px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <span className="text-xs text-slate-400">—</span>
                    <input
                      type="time"
                      value={row.endTime}
                      disabled={!row.active}
                      onChange={(e) => updateRow(index, { endTime: normalizeScheduleTime(e.target.value) })}
                      className="min-w-[120px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // ── CREATE: Weekly yoki Daily (avvalgi holat) ──
            <div className="space-y-5">
              <div className="flex overflow-hidden rounded-2xl border-2 border-slate-200 text-sm font-bold">
                <button
                  type="button"
                  onClick={() => onCreateModeChange("WEEKLY")}
                  className={`min-w-0 flex-1 break-words px-2 py-3 text-center transition ${
                    createMode === "WEEKLY" ? "bg-primary-blue text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {t("modal.weeklyTab")}
                </button>
                <button
                  type="button"
                  onClick={() => onCreateModeChange("DAILY")}
                  className={`min-w-0 flex-1 break-words px-2 py-3 text-center transition ${
                    createMode === "DAILY" ? "bg-primary-blue text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {t("modal.dailyTab")}
                </button>
              </div>

              {createMode === "DAILY" && (
                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-900">
                    {t("modal.workDaysLabel")} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {DAYS.map((day) => {
                      const isSelected = createSelectedDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => onToggleCreateDay(day.value)}
                          className={`rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition ${
                            isSelected
                              ? "border-primary-blue bg-primary-blue text-white shadow-lg shadow-primary-blue/20"
                              : "border-slate-200 bg-white text-slate-700 hover:border-primary-blue/30 hover:bg-primary-blue/5"
                          }`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {createMode === "DAILY" && (
                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-900">{t("modal.slotDurationLabel")}</label>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
                    {DURATION_OPTIONS.map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => onCreateSlotDurationChange(duration)}
                        className={`rounded-2xl border-2 px-3 py-3 text-sm font-extrabold transition ${
                          createSlotDuration === duration
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {duration}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-900">
                    {t("modal.startTimeLabel")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={createStartTime}
                    onChange={(e) => onCreateStartTimeChange(normalizeScheduleTime(e.target.value))}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-900">
                    {t("modal.endTimeLabel")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={createEndTime}
                    onChange={(e) => onCreateEndTimeChange(normalizeScheduleTime(e.target.value))}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {hasExistingSchedule ? (
              <button
                type="button"
                onClick={onDeleteSchedule}
                disabled={isDeleting || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isDeleting ? <DentalLoaderIcon className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                {t("modal.deleteSchedule")}
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                {t("modal.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-blue px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting && <DentalLoaderIcon className="h-4 w-4" />}
                {hasExistingSchedule ? t("modal.saveSchedule") : t("modal.createSchedule")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorSchedulePage() {
  const t = useTranslations("doctors.schedule");
  const toast = useToast();

  const page = 0;
  const limit = 20;

  const [pageView, setPageView] = useState<PageView>("cards");
  const [calendarDoctorId, setCalendarDoctorId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "ALL">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDoctorId, setModalDoctorId] = useState("");

  // EDIT mode state (mavjud schedule bo'lganda)
  const [dayRows, setDayRows] = useState<DayRow[]>(buildEmptyDayRows());

  // CREATE mode state (schedule hali yo'q bo'lganda) — Weekly / Daily
  const [createMode, setCreateMode] = useState<CreateMode>("WEEKLY");
  const [createStartTime, setCreateStartTime] = useState("09:00");
  const [createEndTime, setCreateEndTime] = useState("18:00");
  const [createSelectedDays, setCreateSelectedDays] = useState<DayOfWeek[]>([]);
  const [createSlotDuration, setCreateSlotDuration] = useState(30);

  const {
    data: schedules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDoctorSchedules(page, limit);

  const { data: doctors = [], isLoading: isDoctorsLoading } = useGetDoctors();

  const doctorOptions = useMemo(() => {
    return doctors.filter((d: any) => {
      const roles: string[] = Array.isArray(d.roles) ? d.roles : d.role ? [d.role] : [];
      return roles.includes("DOCTOR") && d.status !== "DELETED";
    });
  }, [doctors]);

  const doctorsMap = useMemo(() => {
    const map = new Map<string, any>();
    doctors.forEach((d: any) => {
      const id = getDoctorId(d);
      if (id) map.set(id, d);
    });
    return map;
  }, [doctors]);

  const updateScheduleByDayMutation = useUpdateScheduleByDay();
  const createScheduleMutation = useCreateDoctorSchedule();
  const createWeeklyScheduleMutation = useCreateWeeklyDoctorSchedule();
  const deleteScheduleMutation = useDeleteDoctorSchedule();

  const enrichedSchedules = useMemo<FlatDoctorSchedule[]>(() => {
    return (schedules as any[]).map((s) => {
      const docFromSchedule = s.doctor;
      const docFromList = doctorsMap.get(s.doctorId);
      const doc = docFromSchedule ?? docFromList;
      return {
        ...s,
        doctorName: getDoctorName(doc) || s.doctorId || "-",
        startTime: normalizeScheduleTime(s.startTime),
        endTime: normalizeScheduleTime(s.endTime),
      };
    });
  }, [schedules, doctorsMap]);

  // Faqat active kunlar bo'lgan doctorlar kartalar/calendar'da ko'rinadi
  const doctorGroups = useMemo<DoctorScheduleGroup[]>(() => {
    const map = new Map<string, DoctorScheduleGroup>();
    let palIdx = 0;

    enrichedSchedules
      .filter((s) => s.active)
      .forEach((s) => {
        if (!map.has(s.doctorId)) {
          map.set(s.doctorId, {
            doctorId: s.doctorId,
            doctorName: s.doctorName ?? s.doctorId,
            paletteIdx: palIdx++,
            schedules: [],
          });
        }
        map.get(s.doctorId)!.schedules.push(s);
      });

    return Array.from(map.values());
  }, [enrichedSchedules]);

  const filteredSchedules = useMemo(() => {
    const value = search.trim().toLowerCase();
    return enrichedSchedules
      .filter((s) => s.active)
      .filter((s) => {
        if (selectedDay !== "ALL" && s.dayOfWeek !== selectedDay) return false;
        if (!value) return true;
        return (
          String(s.doctorName ?? "").toLowerCase().includes(value) ||
          String(s.dayOfWeek ?? "").toLowerCase().includes(value) ||
          normalizeScheduleTime(s.startTime).includes(value) ||
          normalizeScheduleTime(s.endTime).includes(value)
        );
      });
  }, [enrichedSchedules, selectedDay, search]);

  const filteredDoctorGroups = useMemo<DoctorScheduleGroup[]>(() => {
    const map = new Map<string, DoctorScheduleGroup>();
    let palIdx = 0;

    filteredSchedules.forEach((s) => {
      if (!map.has(s.doctorId)) {
        const original = doctorGroups.find((g) => g.doctorId === s.doctorId);
        map.set(s.doctorId, {
          doctorId: s.doctorId,
          doctorName: s.doctorName ?? s.doctorId,
          paletteIdx: original?.paletteIdx ?? palIdx++,
          schedules: [],
        });
      }
      map.get(s.doctorId)!.schedules.push(s);
    });

    return Array.from(map.values());
  }, [filteredSchedules, doctorGroups]);

  const activeCalendarGroup = useMemo(
    () => doctorGroups.find((g) => g.doctorId === calendarDoctorId) ?? null,
    [doctorGroups, calendarDoctorId]
  );

  const hasExistingScheduleForModalDoctor = Boolean(
    modalDoctorId && getScheduleIdForDoctor(enrichedSchedules, modalDoctorId)
  );

  // ── Actions ──

  function resetCreateState() {
    setCreateMode("WEEKLY");
    setCreateStartTime("09:00");
    setCreateEndTime("18:00");
    setCreateSelectedDays([]);
    setCreateSlotDuration(30);
  }

  function openEditorFor(doctorId: string) {
    setModalDoctorId(doctorId);
    const hasExisting = doctorId && Boolean(getScheduleIdForDoctor(enrichedSchedules, doctorId));
    if (hasExisting) {
      setDayRows(buildDayRowsForDoctor(enrichedSchedules, doctorId));
    } else {
      setDayRows(buildEmptyDayRows());
      resetCreateState();
    }
    setIsModalOpen(true);
  }

  function openCreateModal() {
    openEditorFor("");
  }

  function handleModalDoctorChange(doctorId: string) {
    setModalDoctorId(doctorId);
    const hasExisting = doctorId && Boolean(getScheduleIdForDoctor(enrichedSchedules, doctorId));
    if (hasExisting) {
      setDayRows(buildDayRowsForDoctor(enrichedSchedules, doctorId));
    } else {
      setDayRows(buildEmptyDayRows());
      resetCreateState();
    }
  }

  function closeModal() {
    setModalDoctorId("");
    setDayRows(buildEmptyDayRows());
    resetCreateState();
    setIsModalOpen(false);
  }

  function handleToggleCreateDay(day: DayOfWeek) {
    setCreateSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function openDoctorCalendar(doctorId: string) {
    setCalendarDoctorId(doctorId);
    setPageView("calendar");
  }

  function backToCards() {
    setCalendarDoctorId(null);
    setPageView("cards");
  }

  async function handleDeleteSchedule(doctorId: string) {
    const scheduleId = getScheduleIdForDoctor(enrichedSchedules, doctorId);
    if (!scheduleId) {
      toast.error(t("toast.scheduleIdNotFound"));
      return;
    }
    if (!window.confirm(t("toast.deleteConfirm"))) return;

    try {
      await deleteScheduleMutation.mutateAsync(scheduleId);
      toast.success(t("toast.scheduleDeleted"));
      if (calendarDoctorId === doctorId) backToCards();
      if (modalDoctorId === doctorId) closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.scheduleDeleteFailed")));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!modalDoctorId) {
      toast.warning(t("toast.selectDoctor"));
      return;
    }

    if (hasExistingScheduleForModalDoctor) {
      // ── EDIT: PUT /doctor-schedules/by-day (har kuni alohida qatordan) ──
      for (const row of dayRows) {
        if (row.active && (!row.startTime || !row.endTime)) {
          toast.warning(t("toast.timeNotSet", { day: getDayShort(row.dayOfWeek) }));
          return;
        }
        if (row.active && row.startTime >= row.endTime) {
          toast.warning(t("toast.endAfterStart", { day: getDayShort(row.dayOfWeek) }));
          return;
        }
      }

      try {
        // CLINIC_ADMIN/SUPER_ADMIN boshqa doctor uchun yuboryapti — doctorId MAJBURIY.
        await updateScheduleByDayMutation.mutateAsync({
          doctorId: modalDoctorId,
          days: dayRows,
        });
        toast.success(t("toast.scheduleSaved"));
        closeModal();
      } catch (err) {
        toast.error(getApiErrorMessage(err, t("toast.saveFailed")));
      }
      return;
    }

    // ── CREATE: Weekly yoki Daily ──
    if (!createStartTime || !createEndTime) {
      toast.warning(t("toast.enterStartEndTime"));
      return;
    }
    if (createStartTime >= createEndTime) {
      toast.warning(t("toast.endAfterStartGeneric"));
      return;
    }

    try {
      if (createMode === "WEEKLY") {
        // POST /doctor-schedules/weekly — { doctorId, startTime, endTime, active }
        await createWeeklyScheduleMutation.mutateAsync({
          doctorId: modalDoctorId,
          startTime: createStartTime,
          endTime: createEndTime,
          active: true,
        } as WeeklyDoctorSchedulePayload);
      } else {
        // POST /doctor-schedules — bitta kun uchun, shuning uchun har bir
        // tanlangan kun uchun ketma-ket alohida so'rov yuboriladi.
        if (createSelectedDays.length === 0) {
          toast.warning(t("toast.selectWorkDay"));
          return;
        }
        for (const day of createSelectedDays) {
          await createScheduleMutation.mutateAsync({
            doctorId: modalDoctorId,
            dayOfWeek: day,
            startTime: createStartTime,
            endTime: createEndTime,
            slotDurationMinutes: createSlotDuration,
            active: true,
          } as DoctorSchedulePayload);
        }
      }
      toast.success(t("toast.scheduleCreated"));
      closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.createFailed")));
    }
  }

  const isDataLoading = isLoading || isDoctorsLoading;

  return (
    <div className="min-h-screen from-slate-50 via-blue-50 to-indigo-50">
      <div className="relative top-0 z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-blue text-white shadow-lg">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{t("headerTitle")}</h1>
                <p className="text-sm font-medium text-slate-500">
                  {t("headerSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
              >
                <RefreshCcw className="h-4 w-4" />
                {t("refresh")}
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-primary-blue-dark sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                {t("addSchedule")}
              </button>
            </div>
          </div>

          <div className="mt-4 flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
            {(["cards", "calendar"] as PageView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { if (v === "cards") backToCards(); }}
                className={`rounded-lg px-4 py-1.5 text-sm font-bold capitalize transition ${
                  pageView === v
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v === "cards" ? t("tabDoctors") : activeCalendarGroup?.doctorName ?? t("tabCalendar")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {isDataLoading ? (
          <DentalLoader fullScreen={false} text={t("loading")} />
        ) : isError ? (
          <div className="rounded-3xl border border-red-100 bg-white px-4 py-16 text-center shadow-sm sm:px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-2xl font-extrabold text-red-600">!</div>
            <p className="text-lg font-extrabold text-slate-900">{t("loadErrorTitle")}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {getApiErrorMessage(error, t("loadErrorDefault"))}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-6 rounded-xl bg-primary-blue px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-blue-dark"
            >
              {t("tryAgain")}
            </button>
          </div>
        ) : pageView === "calendar" && activeCalendarGroup ? (
          <WeeklyCalendar
            group={activeCalendarGroup}
            onBack={backToCards}
            onEditSchedule={() => openEditorFor(activeCalendarGroup.doctorId)}
            onDeleteSchedule={() => handleDeleteSchedule(activeCalendarGroup.doctorId)}
            isDeleting={deleteScheduleMutation.isPending}
          />
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[
                { label: t("statTotalActive"), value: enrichedSchedules.filter((s) => s.active).length, color: "text-slate-900" },
                { label: t("statDoctorsWithSchedule"), value: doctorGroups.length, color: "text-emerald-600" },
                { label: t("statDoctors"), value: doctors.length, color: "text-blue-600" },
                { label: t("statSelectedDay"), value: selectedDay === "ALL" ? t("all") : getDayShort(selectedDay), color: "text-indigo-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                  <p className="text-sm font-bold text-slate-500">{stat.label}</p>
                  <p className={`mt-3 text-2xl font-extrabold sm:text-3xl ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDay("ALL")}
                    className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                      selectedDay === "ALL"
                        ? "bg-primary-blue text-white shadow-lg shadow-primary-blue/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t("all")}
                  </button>
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setSelectedDay(day.value)}
                      className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                        selectedDay === day.value
                          ? "bg-primary-blue text-white shadow-lg shadow-primary-blue/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {doctorGroups.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white px-4 py-16 text-center shadow-sm sm:px-6 sm:py-20">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary-blue/5 text-primary-blue">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-slate-900">{t("emptyTitle")}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("emptySubtitle")}
                </p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-blue px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-primary-blue-dark"
                >
                  <Plus className="h-4 w-4" />
                  {t("addSchedule")}
                </button>
              </div>
            ) : filteredDoctorGroups.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white px-4 py-16 text-center shadow-sm sm:px-6 sm:py-20">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                  <Search className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-slate-900">{t("emptyFilteredTitle")}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("emptyFilteredSubtitle")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedDay("ALL");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("clearFilters")}
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDoctorGroups.map((group) => (
                  <DoctorCard
                    key={group.doctorId}
                    group={group}
                    onView={() => openDoctorCalendar(group.doctorId)}
                    onEditSchedule={() => openEditorFor(group.doctorId)}
                    onDeleteSchedule={() => handleDeleteSchedule(group.doctorId)}
                    isDeleting={deleteScheduleMutation.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <WeekEditorModal
        open={isModalOpen}
        doctorId={modalDoctorId}
        doctors={doctorOptions}
        isDoctorLocked={false}
        onDoctorChange={handleModalDoctorChange}
        hasExistingSchedule={hasExistingScheduleForModalDoctor}
        dayRows={dayRows}
        onChangeDayRows={setDayRows}
        createMode={createMode}
        onCreateModeChange={setCreateMode}
        createStartTime={createStartTime}
        createEndTime={createEndTime}
        onCreateStartTimeChange={setCreateStartTime}
        onCreateEndTimeChange={setCreateEndTime}
        createSelectedDays={createSelectedDays}
        onToggleCreateDay={handleToggleCreateDay}
        createSlotDuration={createSlotDuration}
        onCreateSlotDurationChange={setCreateSlotDuration}
        isSubmitting={
          updateScheduleByDayMutation.isPending ||
          createScheduleMutation.isPending ||
          createWeeklyScheduleMutation.isPending
        }
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDeleteSchedule={() => handleDeleteSchedule(modalDoctorId)}
        isDeleting={deleteScheduleMutation.isPending}
      />
    </div>
  );
}