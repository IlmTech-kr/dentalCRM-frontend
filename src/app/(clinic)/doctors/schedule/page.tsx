"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Edit2,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useCreateDoctorSchedule,
  useCreateWeeklyDoctorSchedule,
  useGetDoctorSchedules,
  useUpdateDoctorSchedule,
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
import { useAuthStore } from "@/src/store/auth.store";

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

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90];

const CALENDAR_HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00–18:00

const AVATAR_PALETTE = [
  { bg: "bg-blue-100",   text: "text-blue-800"   },
  { bg: "bg-teal-100",   text: "text-teal-800"   },
  { bg: "bg-pink-100",   text: "text-pink-800"   },
  { bg: "bg-amber-100",  text: "text-amber-800"  },
  { bg: "bg-purple-100", text: "text-purple-800" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PageView = "cards" | "calendar";

type ScheduleForm = DoctorSchedulePayload & {
  slotDurationMinutes?: number;
};

type FlatDoctorSchedule = DoctorSchedule & {
  doctorName?: string;
  scheduleParentId?: string;
  scheduleRowKey?: string;
};

interface DoctorScheduleGroup {
  doctorId: string;
  doctorName: string;
  paletteIdx: number;
  schedules: FlatDoctorSchedule[];
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialForm: ScheduleForm = {
  doctorId: "",
  dayOfWeek: DayOfWeek.MONDAY,
  startTime: "09:00",
  endTime: "18:00",
  slotDurationMinutes: 30,
  active: true,
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function normalizeScheduleTime(time?: string | null): string {
  if (!time) return "";
  const value = String(time).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value.slice(0, 5);
  return value;
}

function getScheduleId(schedule: DoctorSchedule | null): string {
  if (!schedule) return "";
  return (schedule as any)._id ?? (schedule as any).id ?? "";
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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  paletteIdx = 0,
  size = "md",
}: {
  name: string;
  paletteIdx?: number;
  size?: "sm" | "md";
}) {
  const { bg, text } = AVATAR_PALETTE[paletteIdx % AVATAR_PALETTE.length];
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl font-extrabold ${sizeClass} ${bg} ${text}`}
    >
      {getDoctorInitials(name)}
    </div>
  );
}

// ─── Doctor card ──────────────────────────────────────────────────────────────

function DoctorCard({
  group,
  onView,
  onAddSchedule,
}: {
  group: DoctorScheduleGroup;
  onView: () => void;
  onAddSchedule: () => void;
}) {
  const { bg, text } = AVATAR_PALETTE[group.paletteIdx % AVATAR_PALETTE.length];
  const activeDays = group.schedules.filter((s) => s.active);
  const uniqueDays = [...new Set(group.schedules.map((s) => s.dayOfWeek))];

  return (
    <div className="flex flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${bg} ${text}`}
        >
          {getDoctorInitials(group.doctorName)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-extrabold text-slate-900">{group.doctorName}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <UserRound className="h-3 w-3" />
            <span className="truncate">{group.doctorId}</span>
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1.5">
        {DAYS.map((d) => {
          const active = uniqueDays.includes(d.value);
          return (
            <div
              key={d.value}
              title={d.label}
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
          {uniqueDays.length} days/wk
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {activeDays.length} active
        </span>
      </div>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          View schedule
        </button>
        <button
          type="button"
          onClick={onAddSchedule}
          title="Add a day to this doctor"
          className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Weekly calendar view ─────────────────────────────────────────────────────

function WeeklyCalendar({
  group,
  onBack,
  onEdit,
  onAddSchedule,
  showBackButton = true,
}: {
  group: DoctorScheduleGroup;
  onBack: () => void;
  onEdit: (s: FlatDoctorSchedule) => void;
  onAddSchedule: () => void;
  showBackButton?: boolean;
}) {
  const { bg, text } = AVATAR_PALETTE[group.paletteIdx % AVATAR_PALETTE.length];

  const byDay = useMemo(() => {
    const map = new Map<DayOfWeek, FlatDoctorSchedule[]>();
    group.schedules.forEach((s) => {
      if (!s.dayOfWeek) return;
      const arr = map.get(s.dayOfWeek) ?? [];
      arr.push(s);
      map.set(s.dayOfWeek, arr);
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
              All doctors
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
              <p className="text-xs text-slate-500">Weekly work schedule</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddSchedule}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add day
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Work days", value: byDay.size, color: "text-slate-900" },
          {
            label: "Active slots",
            value: group.schedules.filter((s) => s.active).length,
            color: "text-emerald-600",
          },
          {
            label: "Hours / week",
            value: `${group.schedules.reduce((acc, s) => {
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
                    hasSlots ? "text-blue-600" : "text-slate-400"
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
                  const isWorkDay = byDay.has(d.value);
                  return (
                    <div
                      key={d.value}
                      className={`relative border-l border-slate-50 ${!isWorkDay ? "bg-slate-50/60" : ""}`}
                    >
                      {isWorkDay &&
                        byDay.get(d.value)!.map((slot) => {
                          const start = normalizeScheduleTime(slot.startTime);
                          const end = normalizeScheduleTime(slot.endTime);
                          const startH = parseInt(start);
                          const endH = parseInt(end);
                          if (isNaN(startH) || hour !== startH) return null;
                          const spanH = endH - startH;
                          return (
                            <div
                              key={slot.scheduleRowKey}
                              className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border-l-2 border-blue-400 bg-blue-50"
                              style={{ top: 2, height: spanH * ROW_H - 4 }}
                            >
                              <div className="flex h-full flex-col justify-between p-2">
                                <div>
                                  <p className="text-[10px] font-extrabold text-blue-800">
                                    {start} – {end}
                                  </p>
                                  <p className="mt-0.5 text-[9px] text-blue-600">
                                    {slot.slotDurationMinutes ?? 30}min slots
                                  </p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                                      slot.active
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-200 text-slate-500"
                                    }`}
                                  >
                                    {slot.active ? "Active" : "Off"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onEdit(slot)}
                                    className="rounded-md p-1 text-blue-500 hover:bg-blue-100"
                                  >
                                    <Edit2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
          <span className="h-2.5 w-2.5 rounded-sm border-l-2 border-blue-400 bg-blue-50" />
          Work hours
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-100" />
          Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          Inactive
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-50" />
          Day off
        </span>
      </div>
    </div>
  );
}

// ─── Schedule modal ───────────────────────────────────────────────────────────

interface ScheduleModalProps {
  open: boolean;
  form: ScheduleForm;
  doctors: any[];
  selectedSchedule: FlatDoctorSchedule | null;
  isSubmitting: boolean;
  createForWholeWeek: boolean;
  onCreateForWholeWeekChange: (value: boolean) => void;
  onClose: () => void;
  onChange: (form: ScheduleForm) => void;
  onDoctorChange: (doctorId: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  selectedDays: DayOfWeek[];
  onToggleDay: (day: DayOfWeek) => void;
  busyDaysForDoctor: Set<DayOfWeek>;
  hasExistingSchedule: boolean;
}

function ScheduleModal({
  open,
  form,
  doctors,
  selectedSchedule,
  isSubmitting,
  createForWholeWeek,
  onCreateForWholeWeekChange,
  onClose,
  onChange,
  onDoctorChange,
  onSubmit,
  selectedDays,
  onToggleDay,
  busyDaysForDoctor,
  hasExistingSchedule,
}: ScheduleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

      <div className="relative z-100 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {selectedSchedule ? "Edit Doctor Schedule" : "Create Schedule"}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {createForWholeWeek && !selectedSchedule
                  ? "Create same working time for all days of the week."
                  : !selectedSchedule && hasExistingSchedule
                  ? "Bu doctor uchun schedule mavjud — bo'sh kunlarga qo'shiladi (update)."
                  : "Set doctor working day, start time and end time."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-7 px-6 py-7">
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              value={form.doctorId}
              disabled={Boolean(selectedSchedule)}
              onChange={(e) => onDoctorChange(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Select doctor</option>
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
                Role = DOCTOR bo'lgan hech qanday foydalanuvchi topilmadi.
              </p>
            )}
          </div>

          {!selectedSchedule && (
            <div className="flex items-center justify-between rounded-2xl border-2 border-blue-100 bg-blue-50 px-4 py-4">
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  {hasExistingSchedule ? "Update for whole week" : "Create for whole week"}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {hasExistingSchedule
                    ? "Barcha 7 kun shu vaqt bilan yangilanadi (mavjudlari ustidan yoziladi)."
                    : "This will create the same schedule for all days."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCreateForWholeWeekChange(!createForWholeWeek)}
                className={`relative h-8 w-14 rounded-full transition ${createForWholeWeek ? "bg-blue-600" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${createForWholeWeek ? "left-7" : "left-1"}`}
                />
              </button>
            </div>
          )}

          {!createForWholeWeek && (
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                {selectedSchedule ? "Working Day" : "Working Day(s)"} <span className="text-red-500">*</span>
              </label>

              {!selectedSchedule && hasExistingSchedule && (
                <p className="mb-3 text-xs font-semibold text-blue-600">
                  Band kunlar o'chirilgan (disabled). Bo'sh kunlardan xohlagancha tanlashingiz mumkin.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DAYS.map((day) => {
                  const isBusy = !selectedSchedule && busyDaysForDoctor.has(day.value);
                  const isSelected = selectedSchedule
                    ? form.dayOfWeek === day.value
                    : selectedDays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        if (isBusy) return;
                        if (selectedSchedule) {
                          onChange({ ...form, dayOfWeek: day.value });
                        } else {
                          onToggleDay(day.value);
                        }
                      }}
                      className={`rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition ${
                        isBusy
                          ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300"
                          : isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {day.short}
                      {isBusy && (
                        <span className="mt-0.5 block text-[9px] font-bold normal-case text-slate-400">
                          band
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={normalizeScheduleTime(form.startTime)}
                onChange={(e) =>
                  onChange({ ...form, startTime: normalizeScheduleTime(e.target.value) })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={normalizeScheduleTime(form.endTime)}
                onChange={(e) =>
                  onChange({ ...form, endTime: normalizeScheduleTime(e.target.value) })
                }
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {!createForWholeWeek && (
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">Slot Duration</label>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
                {DURATION_OPTIONS.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => onChange({ ...form, slotDurationMinutes: duration })}
                    className={`rounded-2xl border-2 px-3 py-3 text-sm font-extrabold transition ${
                      form.slotDurationMinutes === duration
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

          <div className="flex items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4">
            <div>
              <p className="text-sm font-extrabold text-slate-900">Schedule Active</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                If inactive, this schedule will not be used for appointments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...form, active: !form.active })}
              className={`relative h-8 w-14 rounded-full transition ${form.active ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${form.active ? "left-7" : "left-1"}`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {selectedSchedule
                ? "Save Changes"
                : hasExistingSchedule
                ? "Kunlarni qo'shish"
                : createForWholeWeek
                ? "Create Weekly Schedule"
                : "Create Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorSchedulePage() {
  const toast = useToast();

  /**
   * PATCH 1: useState(0) / useState(20) → oddiy const.
   * Setter ishlatilmaydi, useState keraksiz edi.
   */
  const page = 0;
  const limit = 20;

  /**
   * Doctor rolidagi user faqat O'ZINING schedule'ini ko'rishi va
   * boshqarishi kerak — boshqa doctorlar ro'yxati/tanlovi yashiriladi.
   *
   * DIQQAT: `useAuthStore((s) => s.user)` bu yerda joriy login qilgan
   * userning profilini qaytaradi deb faraz qilinmoqda (Sidebar.tsx dagi
   * isAdmin()/isDoctor() kabi flag'lar bilan bir xil store). Agar
   * auth.store.ts da user obyekti boshqacha nomlangan bo'lsa
   * (masalan useAuthStore((s) => s.currentUser)), shu qatorni almashtirish
   * kifoya.
   */
  const isAdminRole = useAuthStore((s) => s.isAdmin());
  const isClinicAdminRole = useAuthStore((s) => s.isClinicAdmin());
  const isStaffAdmin = isAdminRole || isClinicAdminRole;
  const isDoctorRole = useAuthStore((s) => s.isDoctor());
  const currentUser = useAuthStore((s) => s.user);
  const ownDoctorId = currentUser
    ? (currentUser as any)?.id ?? (currentUser as any)?._id ?? ""
    : "";

  /**
   * Faqat o'z schedule'ini ko'radigan/boshqaradigan rejim:
   * doctor role bo'lib, staff admin bo'lmasa yoqiladi.
   */
  const isSelfOnlyMode = isDoctorRole && !isStaffAdmin;

  const [pageView, setPageView] = useState<PageView>("cards");
  const [calendarDoctorId, setCalendarDoctorId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "ALL">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<FlatDoctorSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(initialForm);
  const [createForWholeWeek, setCreateForWholeWeek] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  const {
    data: schedules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDoctorSchedules(page, limit);

  const { data: doctors = [], isLoading: isDoctorsLoading } = useGetDoctors();

  /**
   * Doctor tanlanganda, agar shu doctor uchun schedule (parent hujjat) allaqachon
   * mavjud bo'lsa — create emas, shu hujjatga update qilinishi kerak.
   */
  const existingScheduleForDoctor = useMemo(() => {
    if (!form.doctorId) return null;
    return (schedules as any[]).find((s: any) => s.doctorId === form.doctorId) ?? null;
  }, [schedules, form.doctorId]);

  const hasExistingSchedule = Boolean(existingScheduleForDoctor);

  /**
   * MUHIM: update endpoint URL'ida schedule HUJJATINING O'Z _id'si yuboriladi:
   * PATCH /api/dental/doctor-schedules/{scheduleId}
   * Body ichida esa doctorId, dayOfWeek, startTime, endTime, active qaytariladi. Masalan:
   * PATCH /api/dental/doctor-schedules/6a5ff83291fe43f327cbfcc3
   * { "doctorId": "...", "dayOfWeek": "TUESDAY", "startTime": "09:00", "endTime": "18:00", "active": true }
   */
  const selectedScheduleId = selectedSchedule
    ? selectedSchedule.scheduleParentId ?? getScheduleId(selectedSchedule)
    : getScheduleId(existingScheduleForDoctor);

  /**
   * Faqat role = "DOCTOR" bo'lgan userlar schedule create qila oladi.
   * Boshqa xodimlar (admin, reception va h.k.) doctor select dropdownida chiqmaydi.
   *
   * isSelfOnlyMode (doctor o'zi kirgan bo'lsa) — dropdownda faqat
   * o'zining nomi chiqadi, boshqa doctorlarni tanlay olmaydi.
   */
  const doctorOptions = useMemo(() => {
    const roleFiltered = doctors.filter((d: any) => {
      const roles: string[] = Array.isArray(d.roles)
        ? d.roles
        : d.role
        ? [d.role]
        : [];
      return roles.includes("DOCTOR") && d.status !== "DELETED";
    });

    if (isSelfOnlyMode) {
      return roleFiltered.filter((d: any) => getDoctorId(d) === ownDoctorId);
    }

    return roleFiltered;
  }, [doctors, isSelfOnlyMode, ownDoctorId]);

  const createScheduleMutation = useCreateDoctorSchedule();
  const createWeeklyScheduleMutation = useCreateWeeklyDoctorSchedule();
  const updateScheduleMutation = useUpdateDoctorSchedule(selectedScheduleId);

  const isSubmitting =
    createScheduleMutation.isPending ||
    createWeeklyScheduleMutation.isPending ||
    updateScheduleMutation.isPending;

  const doctorsMap = useMemo(() => {
    const map = new Map<string, any>();
    doctors.forEach((d: any) => {
      const id = getDoctorId(d);
      if (id) map.set(id, d);
    });
    return map;
  }, [doctors]);

  const flatSchedules = useMemo<FlatDoctorSchedule[]>(() => {
    const seen = new Set<string>();

    const rows = schedules.flatMap((schedule: any) => {
      const parentId = getScheduleId(schedule);

      if (Array.isArray(schedule.days) && schedule.days.length > 0) {
        return schedule.days.map((day: any) => {
          const rowKey = [
            parentId || schedule.doctorId || "schedule",
            day.dayOfWeek,
            normalizeScheduleTime(day.startTime),
            normalizeScheduleTime(day.endTime),
          ].join("|");

          return {
            ...schedule,
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
            active: day.active ?? schedule.active,
            slotDurationMinutes: day.slotDurationMinutes ?? schedule.slotDurationMinutes ?? 30,
            days: undefined,
            scheduleParentId: parentId,
            scheduleRowKey: rowKey,
          };
        });
      }

      const rowKey = [
        parentId || schedule.doctorId || "schedule",
        schedule.dayOfWeek,
        normalizeScheduleTime(schedule.startTime),
        normalizeScheduleTime(schedule.endTime),
      ].join("|");

      return [{ ...schedule, scheduleParentId: parentId, scheduleRowKey: rowKey }];
    });

    return rows.filter((row: FlatDoctorSchedule) => {
      const key = row.scheduleRowKey ?? "";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [schedules]);

  /**
   * Tanlangan doctor uchun allaqachon active bo'lgan kunlar to'plami.
   * Modalda bu kunlar tanlab bo'lmaydigan (band) qilib ko'rsatiladi.
   */
  const busyDaysForDoctor = useMemo(() => {
    const set = new Set<DayOfWeek>();
    if (!form.doctorId) return set;
    flatSchedules.forEach((s) => {
      if (s.doctorId === form.doctorId && s.active && s.dayOfWeek) {
        set.add(s.dayOfWeek);
      }
    });
    return set;
  }, [flatSchedules, form.doctorId]);

  const enrichedSchedules = useMemo(() => {
    return flatSchedules.map((s) => {
      const docFromSchedule = (s as any).doctor;
      const docFromList = doctorsMap.get(s.doctorId);
      const doc = docFromSchedule ?? docFromList;
      return {
        ...s,
        doctorName: getDoctorName(doc) || s.doctorId || "-",
        startTime: normalizeScheduleTime(s.startTime),
        endTime: normalizeScheduleTime(s.endTime),
      };
    });
  }, [flatSchedules, doctorsMap]);

  const doctorGroups = useMemo<DoctorScheduleGroup[]>(() => {
    const map = new Map<string, DoctorScheduleGroup>();
    let palIdx = 0;

    enrichedSchedules.forEach((s) => {
      // isSelfOnlyMode: doctor faqat o'z schedule guruhini ko'radi,
      // boshqa doctorlarning yozuvlari umuman group'ga qo'shilmaydi.
      if (isSelfOnlyMode && s.doctorId !== ownDoctorId) return;

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
  }, [enrichedSchedules, isSelfOnlyMode, ownDoctorId]);

  const filteredSchedules = useMemo(() => {
    const value = search.trim().toLowerCase();
    return enrichedSchedules
      .filter((s) => {
        if (isSelfOnlyMode && s.doctorId !== ownDoctorId) return false;
        if (selectedDay !== "ALL" && s.dayOfWeek !== selectedDay) return false;
        if (!value) return true;
        return (
          String(s.doctorName ?? "").toLowerCase().includes(value) ||
          String(s.dayOfWeek ?? "").toLowerCase().includes(value) ||
          normalizeScheduleTime(s.startTime).includes(value) ||
          normalizeScheduleTime(s.endTime).includes(value)
        );
      })
      .sort((a, b) => {
        const dayA = DAYS.findIndex((d) => d.value === a.dayOfWeek);
        const dayB = DAYS.findIndex((d) => d.value === b.dayOfWeek);
        if (dayA !== dayB) return dayA - dayB;
        return normalizeScheduleTime(a.startTime).localeCompare(
          normalizeScheduleTime(b.startTime)
        );
      });
  }, [enrichedSchedules, selectedDay, search, isSelfOnlyMode, ownDoctorId]);

  /**
   * MUHIM: Doctors kartalar grid'i shu vaqtgacha filterlanmagan `doctorGroups`
   * asosida chizilardi — shuning uchun search va kun (Mon/Tue/...) filterlari
   * hech narsani o'zgartirmasdi. Endi kartalar `filteredDoctorGroups`dan
   * (search + selectedDay hisobga olingan holda) chiziladi.
   */
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

  /**
   * isSelfOnlyMode: doctor login qilganda "Doctors" kartalar ro'yxatini
   * ko'rsatmasdan, to'g'ridan-to'g'ri o'zining haftalik calendar
   * ko'rinishiga olib o'tiladi.
   */
  useEffect(() => {
    if (isSelfOnlyMode && ownDoctorId) {
      setCalendarDoctorId(ownDoctorId);
      setPageView("calendar");
    }
  }, [isSelfOnlyMode, ownDoctorId]);

  // ── Actions ──

  function openCreateModal(prefillDoctorId?: string) {
    setSelectedSchedule(null);
    setCreateForWholeWeek(false);
    setSelectedDays([]);
    setForm({
      ...initialForm,
      doctorId: prefillDoctorId ?? (isSelfOnlyMode ? ownDoctorId : ""),
    });
    setIsModalOpen(true);
  }

  function openEditModal(schedule: FlatDoctorSchedule) {
    setSelectedSchedule(schedule);
    setCreateForWholeWeek(false);
    setSelectedDays([]);
    setForm({
      doctorId: schedule.doctorId ?? "",
      dayOfWeek: schedule.dayOfWeek ?? DayOfWeek.MONDAY,
      startTime: normalizeScheduleTime(schedule.startTime),
      endTime: normalizeScheduleTime(schedule.endTime),
      slotDurationMinutes: Number((schedule as any).slotDurationMinutes ?? 30),
      active: schedule.active !== false,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setSelectedSchedule(null);
    setCreateForWholeWeek(false);
    setSelectedDays([]);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function handleDoctorChange(doctorId: string) {
    setForm((prev) => ({ ...prev, doctorId }));
    setSelectedDays([]);
  }

  function handleToggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const startTime = normalizeScheduleTime(form.startTime);
    const endTime = normalizeScheduleTime(form.endTime);

    if (!form.doctorId) { toast.warning("Please select a doctor."); return; }
    if (!startTime) { toast.warning("Start time is invalid."); return; }
    if (!endTime) { toast.warning("End time is invalid."); return; }
    if (startTime >= endTime) { toast.warning("End time must be later than start time."); return; }

    if (!selectedSchedule && !createForWholeWeek && selectedDays.length === 0) {
      toast.warning("Kamida bitta ish kunini tanlang.");
      return;
    }

    try {
      if (selectedSchedule) {
        // ── Bitta kunni tahrirlash (mavjud row) ──
        if (!selectedScheduleId) { toast.error("Schedule ID not found."); return; }
        await updateScheduleMutation.mutateAsync({
          doctorId: form.doctorId,
          dayOfWeek: form.dayOfWeek,
          startTime,
          endTime,
          active: Boolean(form.active),
          slotDurationMinutes: Number(form.slotDurationMinutes ?? 30),
        });
        toast.success("Doctor schedule updated successfully.");
      } else if (hasExistingSchedule) {
        // ── Doctorda schedule allaqachon mavjud → create emas, update qilinadi ──
        const daysToUpdate = createForWholeWeek
          ? DAYS.map((d) => d.value)
          : selectedDays;

        for (const day of daysToUpdate) {
          await updateScheduleMutation.mutateAsync({
            doctorId: form.doctorId,
            dayOfWeek: day,
            startTime,
            endTime,
            active: Boolean(form.active),
            slotDurationMinutes: Number(form.slotDurationMinutes ?? 30),
          });
        }
        toast.success("Doctor schedule yangilandi.");
      } else if (createForWholeWeek) {
        // ── Doctorda hali schedule yo'q, butun hafta uchun yaratish ──
        await createWeeklyScheduleMutation.mutateAsync({
          doctorId: form.doctorId,
          startTime,
          endTime,
          active: Boolean(form.active),
        } as WeeklyDoctorSchedulePayload);
        toast.success("Weekly doctor schedule created successfully.");
      } else {
        // ── Doctorda hali schedule yo'q, yangi hujjat bitta kun bilan yaratiladi ──
        const [firstDay] = selectedDays;
        await createScheduleMutation.mutateAsync({
          doctorId: form.doctorId,
          dayOfWeek: firstDay,
          startTime,
          endTime,
          active: Boolean(form.active),
          slotDurationMinutes: Number(form.slotDurationMinutes ?? 30),
        } as DoctorSchedulePayload);

        if (selectedDays.length > 1) {
          toast.warning(
            "Faqat birinchi kun yaratildi. Qolgan kunlarni qo'shish uchun 'Add day' tugmasini yana bosing."
          );
        } else {
          toast.success("Doctor schedule created successfully.");
        }
      }

      /**
       * PATCH 2: await refetch() olib tashlandi.
       * Har uchala mutation onSuccess da invalidateQueries chaqiradi —
       * query avtomatik yangilanadi.
       */
      closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "An error occurred while saving the schedule."));
    }
  }

  const isDataLoading = isLoading || isDoctorsLoading;

  return (
    <div className="min-h-screen from-slate-50 via-blue-50 to-indigo-50">
      <div className="relative top-0 z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {isSelfOnlyMode ? "My Schedule" : "Doctor Schedule"}
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  {isSelfOnlyMode
                    ? "Manage your own working days and appointment slots."
                    : "Manage doctors working days and appointment slots."}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {/**
               * PATCH 3: refetch() "Refresh" button va "Try Again" uchun saqlanib qoldi.
               * handleSubmit dan olib tashlandi, lekin UI da kerak.
               */}
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add Schedule
              </button>
            </div>
          </div>

          {/* isSelfOnlyMode: doctorda faqat bitta ("o'zi") schedule bo'lgani uchun
              Doctors/Calendar tab toggle keraksiz — shuning uchun yashiriladi. */}
          {!isSelfOnlyMode && (
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
                {v === "cards" ? "Doctors" : activeCalendarGroup?.doctorName ?? "Calendar"}
              </button>
            ))}
          </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {isDataLoading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Loading schedules…
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-2xl font-extrabold text-red-600">!</div>
            <p className="text-lg font-extrabold text-slate-900">Failed to load schedules</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {getApiErrorMessage(error, "Server error. Please check the backend API.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : pageView === "calendar" && activeCalendarGroup ? (
          <WeeklyCalendar
            group={activeCalendarGroup}
            onBack={backToCards}
            onEdit={openEditModal}
            onAddSchedule={() => openCreateModal(activeCalendarGroup.doctorId)}
            showBackButton={!isSelfOnlyMode}
          />
        ) : isSelfOnlyMode ? (
          // Doctorda hali umuman schedule yo'q — soddalashtirilgan holat
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-7 w-7" />
            </div>
            <p className="text-lg font-extrabold text-slate-900">
              Sizda hali schedule mavjud emas
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Ish kunlaringizni belgilash uchun schedule yarating.
            </p>
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Schedule yaratish
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total schedules", value: flatSchedules.length, color: "text-slate-900" },
                { label: "Active schedules", value: flatSchedules.filter((s) => s.active).length, color: "text-emerald-600" },
                { label: "Doctors", value: doctors.length, color: "text-blue-600" },
                { label: "Selected day", value: selectedDay === "ALL" ? "All" : getDayShort(selectedDay), color: "text-indigo-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="text-sm font-bold text-slate-500">{stat.label}</p>
                  <p className={`mt-3 text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search doctor, day or time…"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDay("ALL")}
                    className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                      selectedDay === "ALL"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All
                  </button>
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setSelectedDay(day.value)}
                      className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                        selectedDay === day.value
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
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
              <div className="rounded-3xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-slate-900">No schedules found</p>
                <p className="mt-2 text-sm text-slate-500">
                  Create a doctor schedule to start accepting appointments.
                </p>
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Schedule
                </button>
              </div>
            ) : filteredDoctorGroups.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                  <Search className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-slate-900">Filterga mos schedule topilmadi</p>
                <p className="mt-2 text-sm text-slate-500">
                  Boshqa kun tanlang yoki qidiruvni tozalang.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedDay("ALL");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Filterlarni tozalash
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDoctorGroups.map((group) => (
                  <DoctorCard
                    key={group.doctorId}
                    group={group}
                    onView={() => openDoctorCalendar(group.doctorId)}
                    onAddSchedule={() => openCreateModal(group.doctorId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <ScheduleModal
        open={isModalOpen}
        form={form}
        doctors={doctorOptions}
        selectedSchedule={selectedSchedule}
        isSubmitting={isSubmitting}
        createForWholeWeek={createForWholeWeek}
        onCreateForWholeWeekChange={setCreateForWholeWeek}
        onClose={closeModal}
        onChange={setForm}
        onDoctorChange={handleDoctorChange}
        onSubmit={handleSubmit}
        selectedDays={selectedDays}
        onToggleDay={handleToggleDay}
        busyDaysForDoctor={busyDaysForDoctor}
        hasExistingSchedule={hasExistingSchedule}
      />
    </div>
  );
}