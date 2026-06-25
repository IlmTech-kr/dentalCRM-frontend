"use client";

import { FormEvent, useMemo, useState } from "react";
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
}: {
  group: DoctorScheduleGroup;
  onBack: () => void;
  onEdit: (s: FlatDoctorSchedule) => void;
  onAddSchedule: () => void;
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
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            All doctors
          </button>

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
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
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
  onSubmit,
}: ScheduleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {selectedSchedule ? "Edit Doctor Schedule" : "Create Schedule"}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {createForWholeWeek && !selectedSchedule
                  ? "Create same working time for all days of the week."
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
              onChange={(e) => onChange({ ...form, doctorId: e.target.value })}
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
          </div>

          {!selectedSchedule && (
            <div className="flex items-center justify-between rounded-2xl border-2 border-blue-100 bg-blue-50 px-4 py-4">
              <div>
                <p className="text-sm font-extrabold text-slate-900">Create for whole week</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  This will create the same schedule for all days.
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
                Working Day <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => onChange({ ...form, dayOfWeek: day.value })}
                    className={`rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition ${
                      form.dayOfWeek === day.value
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
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

  const [pageView, setPageView] = useState<PageView>("cards");
  const [calendarDoctorId, setCalendarDoctorId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "ALL">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<FlatDoctorSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(initialForm);
  const [createForWholeWeek, setCreateForWholeWeek] = useState(false);

  const selectedScheduleId =
    selectedSchedule?.scheduleParentId ?? getScheduleId(selectedSchedule);

  const {
    data: schedules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDoctorSchedules(page, limit);

  const { data: doctors = [], isLoading: isDoctorsLoading } = useGetDoctors();

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
      .filter((s) => {
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
  }, [enrichedSchedules, selectedDay, search]);

  const activeCalendarGroup = useMemo(
    () => doctorGroups.find((g) => g.doctorId === calendarDoctorId) ?? null,
    [doctorGroups, calendarDoctorId]
  );

  // ── Actions ──

  function openCreateModal(prefillDoctorId?: string) {
    setSelectedSchedule(null);
    setCreateForWholeWeek(false);
    setForm({ ...initialForm, doctorId: prefillDoctorId ?? "" });
    setIsModalOpen(true);
  }

  function openEditModal(schedule: FlatDoctorSchedule) {
    setSelectedSchedule(schedule);
    setCreateForWholeWeek(false);
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
    setForm(initialForm);
    setIsModalOpen(false);
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
    if (!createForWholeWeek && !form.dayOfWeek) { toast.warning("Please select a working day."); return; }

    try {
      if (selectedSchedule) {
        if (!selectedScheduleId) { toast.error("Schedule ID not found."); return; }
        await updateScheduleMutation.mutateAsync({
          dayOfWeek: form.dayOfWeek,
          startTime,
          endTime,
          active: Boolean(form.active),
          slotDurationMinutes: Number(form.slotDurationMinutes ?? 30),
        });
        toast.success("Doctor schedule updated successfully.");
      } else if (createForWholeWeek) {
        await createWeeklyScheduleMutation.mutateAsync({
          doctorId: form.doctorId,
          startTime,
          endTime,
          active: Boolean(form.active),
        } as WeeklyDoctorSchedulePayload);
        toast.success("Weekly doctor schedule created successfully.");
      } else {
        await createScheduleMutation.mutateAsync({
          doctorId: form.doctorId,
          dayOfWeek: form.dayOfWeek,
          startTime,
          endTime,
          active: Boolean(form.active),
          slotDurationMinutes: Number(form.slotDurationMinutes ?? 30),
        } as DoctorSchedulePayload);
        toast.success("Doctor schedule created successfully.");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Doctor Schedule</h1>
                <p className="text-sm font-medium text-slate-500">
                  Manage doctors working days and appointment slots.
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
          />
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
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {doctorGroups.map((group) => (
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
        doctors={doctors}
        selectedSchedule={selectedSchedule}
        isSubmitting={isSubmitting}
        createForWholeWeek={createForWholeWeek}
        onCreateForWholeWeekChange={setCreateForWholeWeek}
        onClose={closeModal}
        onChange={setForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}