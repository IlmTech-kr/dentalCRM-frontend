"use client";

/**
 * File: src/app/(dashboard)/my-schedule/page.tsx
 *
 * Doctor role uchun MUSTAQIL sahifa — /doctors/schedule (admin sahifasi)
 * dan butunlay ajratilgan. useGetDoctors() UMUMAN chaqirilmaydi.
 *
 * Backend kontraktlari admin sahifasi bilan bir xil:
 * - EDIT (schedule allaqachon mavjud) → PUT /doctor-schedules/by-day
 *   { days: [...] } — doctorId YUBORILMAYDI, backend token orqali aniqlaydi.
 * - CREATE + Weekly (schedule hali yo'q) → POST /doctor-schedules/weekly
 *   { doctorId, startTime, endTime, active }
 * - CREATE + Daily (schedule hali yo'q) → POST /doctor-schedules (har bir
 *   tanlangan kun uchun alohida so'rov)
 *   { doctorId, dayOfWeek, startTime, endTime, slotDurationMinutes, active }
 *
 * MUHIM: create endpointlari (weekly/daily) doctorId talab qiladi — bu
 * yerda "boshqa doctor uchun" emas, "o'zining ID'sini yuborish" ma'nosida
 * ishlatiladi (backend buni token bilan solishtirib tekshiradi deb
 * taxmin qilinmoqda). Faqat by-day (edit) so'rovida doctorId shart emas.
 */

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Clock, Edit2, Loader2, Plus, RefreshCcw, Trash2, X } from "lucide-react";

import {
  useCreateDoctorSchedule,
  useCreateWeeklyDoctorSchedule,
  useDeleteDoctorSchedule,
  useGetDoctorSchedules,
  useUpdateScheduleByDay,
} from "@/src/features/doctors/hooks/useDoctorSchedules";

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

const CALENDAR_HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00–18:00
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90];

// ─── Types ────────────────────────────────────────────────────────────────────

type CreateMode = "WEEKLY" | "DAILY";

type DayRow = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeScheduleTime(time?: string | null): string {
  if (!time) return "";
  const value = String(time).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value.slice(0, 5);
  return value;
}

function getDayShort(day?: DayOfWeek | string): string {
  return DAYS.find((d) => d.value === day)?.short ?? String(day ?? "-");
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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function buildDayRowsFromSchedules(schedules: DoctorSchedule[], ownDoctorId: string): DayRow[] {
  const byDay = new Map<string, DoctorSchedule>();
  schedules
    .filter((s: any) => s.doctorId === ownDoctorId)
    .forEach((s: any) => {
      if (s.dayOfWeek) byDay.set(s.dayOfWeek, s);
    });

  return DAYS.map((d) => {
    const existing: any = byDay.get(d.value);
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

// ─── Week editor modal (EDIT: har kuni alohida / CREATE: Weekly yoki Daily) ──

interface WeekEditorModalProps {
  open: boolean;
  hasExistingSchedule: boolean;

  // EDIT mode
  dayRows: DayRow[];
  onChangeDayRows: (rows: DayRow[]) => void;

  // CREATE mode
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
  if (!open) return null;

  function updateRow(index: number, patch: Partial<DayRow>) {
    const next = dayRows.slice();
    next[index] = { ...next[index], ...patch };
    onChangeDayRows(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {hasExistingSchedule ? "Edit My Weekly Schedule" : "Create My Schedule"}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {hasExistingSchedule
                  ? "Belgilangan (checked) kunlar active bo'ladi, belgilanmagan kunlar dam kuni (off) bo'lib saqlanadi."
                  : "Ish vaqtingizni butun hafta (Weekly) yoki aniq kunlar (Daily) bo'yicha belgilang."}
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

        <form onSubmit={onSubmit} className="space-y-6 px-6 py-7">
          {hasExistingSchedule ? (
            // ── EDIT: har kuni alohida qator (mavjud holat) ──
            <div className="space-y-2.5">
              {DAYS.map((day, index) => {
                const row = dayRows[index];
                return (
                  <div
                    key={day.value}
                    className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-3 transition ${
                      row.active ? "border-blue-200 bg-blue-50/40" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={row.active}
                        onChange={(e) => updateRow(index, { active: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-extrabold text-slate-900">{day.label}</span>
                    </label>

                    <input
                      type="time"
                      value={row.startTime}
                      disabled={!row.active}
                      onChange={(e) => updateRow(index, { startTime: normalizeScheduleTime(e.target.value) })}
                      className="min-w-[120px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <span className="text-xs text-slate-400">—</span>
                    <input
                      type="time"
                      value={row.endTime}
                      disabled={!row.active}
                      onChange={(e) => updateRow(index, { endTime: normalizeScheduleTime(e.target.value) })}
                      className="min-w-[120px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // ── CREATE: Weekly yoki Daily ──
            <div className="space-y-5">
              <div className="flex overflow-hidden rounded-2xl border-2 border-slate-200 text-sm font-bold">
                <button
                  type="button"
                  onClick={() => onCreateModeChange("WEEKLY")}
                  className={`flex-1 py-3 transition ${
                    createMode === "WEEKLY" ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Weekly (butun hafta)
                </button>
                <button
                  type="button"
                  onClick={() => onCreateModeChange("DAILY")}
                  className={`flex-1 py-3 transition ${
                    createMode === "DAILY" ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Daily (aniq kunlar)
                </button>
              </div>

              {createMode === "DAILY" && (
                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-900">
                    Ish kunlari <span className="text-red-500">*</span>
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
                              ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
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
                  <label className="mb-3 block text-sm font-bold text-slate-900">Slot Duration</label>
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
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={createStartTime}
                    onChange={(e) => onCreateStartTimeChange(normalizeScheduleTime(e.target.value))}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-900">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={createEndTime}
                    onChange={(e) => onCreateEndTimeChange(normalizeScheduleTime(e.target.value))}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
            {hasExistingSchedule ? (
              <button
                type="button"
                onClick={onDeleteSchedule}
                disabled={isDeleting || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Schedule
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-3">
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
                {hasExistingSchedule ? "Save Schedule" : "Create Schedule"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MySchedulePage() {
  const toast = useToast();

  const currentUser = useAuthStore((s) => s.user);
  const isDoctorRole = useAuthStore((s) => s.isDoctor());
  const ownDoctorId = currentUser
    ? (currentUser as any)?.id ?? (currentUser as any)?._id ?? ""
    : "";
  const ownDoctorName =
    (currentUser as any)?.firstName || (currentUser as any)?.lastName
      ? `${(currentUser as any)?.firstName ?? ""} ${(currentUser as any)?.lastName ?? ""}`.trim()
      : (currentUser as any)?.email || "Men";

  const page = 0;
  const limit = 20;

  const { data: schedules = [], isLoading, isError, error, refetch } = useGetDoctorSchedules(page, limit);
  const updateScheduleByDayMutation = useUpdateScheduleByDay();
  const createScheduleMutation = useCreateDoctorSchedule();
  const createWeeklyScheduleMutation = useCreateWeeklyDoctorSchedule();
  const deleteScheduleMutation = useDeleteDoctorSchedule();

  const ownSchedules = useMemo(
    () => (schedules as any[]).filter((s) => s.doctorId === ownDoctorId && s.active),
    [schedules, ownDoctorId]
  );

  const hasExistingSchedule = ownSchedules.length > 0;

  /**
   * Har bir kun-qatorida (useGetDoctorSchedules natijasi) parent schedule
   * hujjatining id'si `id`/`_id` sifatida takrorlanadi — shu ID DELETE uchun
   * ishlatiladi (butun haftalik hujjatni o'chiradi).
   */
  const ownScheduleId = useMemo(() => {
    const row = (schedules as any[]).find((s) => s.doctorId === ownDoctorId);
    return row ? row.id || row._id || "" : "";
  }, [schedules, ownDoctorId]);

  const byDay = useMemo(() => {
    const map = new Map<DayOfWeek, any>();
    ownSchedules.forEach((s) => {
      if (s.dayOfWeek) map.set(s.dayOfWeek, s);
    });
    return map;
  }, [ownSchedules]);

  const ROW_H = 52;

  const [isModalOpen, setIsModalOpen] = useState(false);

  // EDIT mode state
  const [dayRows, setDayRows] = useState<DayRow[]>([]);

  // CREATE mode state — Weekly / Daily
  const [createMode, setCreateMode] = useState<CreateMode>("WEEKLY");
  const [createStartTime, setCreateStartTime] = useState("09:00");
  const [createEndTime, setCreateEndTime] = useState("18:00");
  const [createSelectedDays, setCreateSelectedDays] = useState<DayOfWeek[]>([]);
  const [createSlotDuration, setCreateSlotDuration] = useState(30);

  function resetCreateState() {
    setCreateMode("WEEKLY");
    setCreateStartTime("09:00");
    setCreateEndTime("18:00");
    setCreateSelectedDays([]);
    setCreateSlotDuration(30);
  }

  function openEditor() {
    if (hasExistingSchedule) {
      setDayRows(buildDayRowsFromSchedules(schedules as any[], ownDoctorId));
    } else {
      resetCreateState();
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleToggleCreateDay(day: DayOfWeek) {
    setCreateSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleDeleteSchedule() {
    if (!ownScheduleId) {
      toast.error("Schedule ID topilmadi.");
      return;
    }
    if (!window.confirm("Butun haftalik schedule'ingiz o'chirilsinmi?")) return;

    try {
      await deleteScheduleMutation.mutateAsync(ownScheduleId);
      toast.success("Schedule o'chirildi.");
      closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Schedule o'chirishda xatolik yuz berdi."));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!ownDoctorId) {
      toast.error("Foydalanuvchi ID topilmadi. Qaytadan login qiling.");
      return;
    }

    if (hasExistingSchedule) {
      // ── EDIT: PUT /doctor-schedules/by-day (doctorId yuborilmaydi) ──
      for (const row of dayRows) {
        if (row.active && (!row.startTime || !row.endTime)) {
          toast.warning(`${getDayShort(row.dayOfWeek)} uchun vaqt kiritilmagan.`);
          return;
        }
        if (row.active && row.startTime >= row.endTime) {
          toast.warning(`${getDayShort(row.dayOfWeek)}: End time start time'dan keyin bo'lishi kerak.`);
          return;
        }
      }

      try {
        await updateScheduleByDayMutation.mutateAsync({ days: dayRows });
        toast.success("Schedule saved successfully.");
        closeModal();
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Schedule saqlashda xatolik yuz berdi."));
      }
      return;
    }

    // ── CREATE: Weekly yoki Daily (doctorId = o'zining ID'si) ──
    if (!createStartTime || !createEndTime) {
      toast.warning("Start/End time kiriting.");
      return;
    }
    if (createStartTime >= createEndTime) {
      toast.warning("End time start time'dan keyin bo'lishi kerak.");
      return;
    }

    try {
      if (createMode === "WEEKLY") {
        await createWeeklyScheduleMutation.mutateAsync({
          doctorId: ownDoctorId,
          startTime: createStartTime,
          endTime: createEndTime,
          active: true,
        } as WeeklyDoctorSchedulePayload);
      } else {
        if (createSelectedDays.length === 0) {
          toast.warning("Kamida bitta ish kunini tanlang.");
          return;
        }
        for (const day of createSelectedDays) {
          await createScheduleMutation.mutateAsync({
            doctorId: ownDoctorId,
            dayOfWeek: day,
            startTime: createStartTime,
            endTime: createEndTime,
            slotDurationMinutes: createSlotDuration,
            active: true,
          } as DoctorSchedulePayload);
        }
      }
      toast.success("Schedule created successfully.");
      closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Schedule yaratishda xatolik yuz berdi."));
    }
  }

  const isSubmitting =
    updateScheduleByDayMutation.isPending ||
    createScheduleMutation.isPending ||
    createWeeklyScheduleMutation.isPending;

  return (
    <div className="min-h-screen from-slate-50 via-blue-50 to-indigo-50">
      <div className="relative top-0 z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">My Schedule</h1>
                <p className="text-sm font-medium text-slate-500">
                  Manage your own working days and appointment slots.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
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
                onClick={openEditor}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
              >
                <Edit2 className="h-4 w-4" />
                Edit Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {!isDoctorRole ? (
          <div className="rounded-3xl border border-amber-100 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-extrabold text-slate-900">Bu sahifa faqat doctorlar uchun</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Sizning rolingiz doctor emas — bu sahifaga kirish huquqingiz yo'q.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Loading schedule…
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-2xl font-extrabold text-red-600">!</div>
            <p className="text-lg font-extrabold text-slate-900">Failed to load schedule</p>
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
        ) : !hasExistingSchedule ? (
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-7 w-7" />
            </div>
            <p className="text-lg font-extrabold text-slate-900">Sizda hali schedule mavjud emas</p>
            <p className="mt-2 text-sm text-slate-500">Ish kunlaringizni belgilash uchun schedule yarating.</p>
            <button
              type="button"
              onClick={openEditor}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Schedule yaratish
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-xs font-extrabold text-blue-800">
                {getDoctorInitials(ownDoctorName)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{ownDoctorName}</p>
                <p className="text-xs text-slate-500">Weekly work schedule</p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { label: "Work days", value: byDay.size, color: "text-slate-900" },
                { label: "Active slots", value: ownSchedules.length, color: "text-emerald-600" },
                {
                  label: "Hours / week",
                  value: `${ownSchedules.reduce((acc: number, s: any) => {
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
                        <span className="text-[10px] font-semibold text-slate-400">{pad2(hour)}:00</span>
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
                                    className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border-l-2 border-blue-400 bg-blue-50"
                                    style={{ top: 2, height: spanH * ROW_H - 4 }}
                                  >
                                    <div className="flex h-full flex-col justify-between p-2">
                                      <p className="text-[10px] font-extrabold text-blue-800">
                                        {start} – {end}
                                      </p>
                                      <span className="w-fit rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                                        Active
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
                <span className="h-2.5 w-2.5 rounded-sm border-l-2 border-blue-400 bg-blue-50" />
                Work hours
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-50" />
                Day off
              </span>
            </div>
          </div>
        )}
      </main>

      <WeekEditorModal
        open={isModalOpen}
        hasExistingSchedule={hasExistingSchedule}
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
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDeleteSchedule={handleDeleteSchedule}
        isDeleting={deleteScheduleMutation.isPending}
      />
    </div>
  );
}