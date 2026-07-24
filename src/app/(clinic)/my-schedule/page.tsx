"use client";

/**
 * File: src/app/(dashboard)/my-schedule/page.tsx
 *
 * Doctor role uchun MUSTAQIL sahifa — /doctors/schedule (admin sahifasi)
 * dan butunlay ajratilgan. Bu yerda useGetDoctors() UMUMAN chaqirilmaydi,
 * chunki doctor role uchun bu endpoint ruxsat xatosi (403) qaytaradi:
 *   "[Doctor Service] getDoctors failed: Foydalanuvchilarni boshqarishga ruxsat yo'q."
 *
 * Doctor faqat o'zining ma'lumotini (auth.store'dagi `user`) va o'zining
 * schedule'ini (useGetDoctorSchedules, keyin client-side o'z doctorId'i
 * bo'yicha filter) ko'radi/boshqaradi.
 */

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Edit2,
  Loader2,
  Plus,
  RefreshCcw,
  X,
} from "lucide-react";

import {
  useCreateDoctorSchedule,
  useCreateWeeklyDoctorSchedule,
  useGetDoctorSchedules,
  useUpdateDoctorSchedule,
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

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90];
const CALENDAR_HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00–18:00

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleForm = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
};

type FlatDoctorSchedule = DoctorSchedule & {
  scheduleParentId?: string;
  scheduleRowKey?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const initialForm: ScheduleForm = {
  dayOfWeek: DayOfWeek.MONDAY,
  startTime: "09:00",
  endTime: "18:00",
  slotDurationMinutes: 30,
  active: true,
};

// ─── Schedule modal (soddalashtirilgan — doctor select yo'q) ─────────────────

interface ScheduleModalProps {
  open: boolean;
  form: ScheduleForm;
  isEditingOne: boolean;
  isSubmitting: boolean;
  createForWholeWeek: boolean;
  onCreateForWholeWeekChange: (value: boolean) => void;
  onClose: () => void;
  onChange: (form: ScheduleForm) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  selectedDays: DayOfWeek[];
  onToggleDay: (day: DayOfWeek) => void;
  busyDays: Set<DayOfWeek>;
  hasExistingSchedule: boolean;
}

function ScheduleModal({
  open,
  form,
  isEditingOne,
  isSubmitting,
  createForWholeWeek,
  onCreateForWholeWeekChange,
  onClose,
  onChange,
  onSubmit,
  selectedDays,
  onToggleDay,
  busyDays,
  hasExistingSchedule,
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
                {isEditingOne ? "Edit Schedule" : "My Schedule"}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {createForWholeWeek && !isEditingOne
                  ? "Barcha kunlar uchun bir xil vaqt belgilanadi."
                  : !isEditingOne && hasExistingSchedule
                  ? "Band kunlar o'chirilgan. Bo'sh kunlardan xohlagancha tanlang."
                  : "Ish kuningizni, boshlanish va tugash vaqtini belgilang."}
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
          {!isEditingOne && (
            <div className="flex items-center justify-between rounded-2xl border-2 border-blue-100 bg-blue-50 px-4 py-4">
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  {hasExistingSchedule ? "Update for whole week" : "Create for whole week"}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Barcha 7 kun shu vaqt bilan belgilanadi.
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
                {isEditingOne ? "Working Day" : "Working Day(s)"} <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DAYS.map((day) => {
                  const isBusy = !isEditingOne && busyDays.has(day.value);
                  const isSelected = isEditingOne
                    ? form.dayOfWeek === day.value
                    : selectedDays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        if (isBusy) return;
                        if (isEditingOne) onChange({ ...form, dayOfWeek: day.value });
                        else onToggleDay(day.value);
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
                onChange={(e) => onChange({ ...form, startTime: normalizeScheduleTime(e.target.value) })}
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
                onChange={(e) => onChange({ ...form, endTime: normalizeScheduleTime(e.target.value) })}
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
                Nofaol bo'lsa, bu schedule appointmentlar uchun ishlatilmaydi.
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
              {isEditingOne
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

  const createScheduleMutation = useCreateDoctorSchedule();
  const createWeeklyScheduleMutation = useCreateWeeklyDoctorSchedule();

  // Faqat shu doctor'ga tegishli parent hujjat (agar mavjud bo'lsa)
  const ownScheduleDoc = useMemo(() => {
    if (!ownDoctorId) return null;
    return (schedules as any[]).find((s: any) => s.doctorId === ownDoctorId) ?? null;
  }, [schedules, ownDoctorId]);

  const hasExistingSchedule = Boolean(ownScheduleDoc);
  const scheduleId = getScheduleId(ownScheduleDoc);

  const updateScheduleMutation = useUpdateDoctorSchedule(scheduleId);

  const isSubmitting =
    createScheduleMutation.isPending ||
    createWeeklyScheduleMutation.isPending ||
    updateScheduleMutation.isPending;

  // Parent hujjatni kunlarga yoyish (flat)
  const flatDays = useMemo<FlatDoctorSchedule[]>(() => {
    if (!ownScheduleDoc) return [];
    const parentId = getScheduleId(ownScheduleDoc);

    if (Array.isArray(ownScheduleDoc.days) && ownScheduleDoc.days.length > 0) {
      return ownScheduleDoc.days.map((day: any) => ({
        ...ownScheduleDoc,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        active: day.active ?? ownScheduleDoc.active,
        slotDurationMinutes: day.slotDurationMinutes ?? ownScheduleDoc.slotDurationMinutes ?? 30,
        scheduleParentId: parentId,
      }));
    }

    return [{ ...ownScheduleDoc, scheduleParentId: parentId }];
  }, [ownScheduleDoc]);

  const byDay = useMemo(() => {
    const map = new Map<DayOfWeek, FlatDoctorSchedule>();
    flatDays.forEach((d) => {
      if (d.dayOfWeek) map.set(d.dayOfWeek as DayOfWeek, d);
    });
    return map;
  }, [flatDays]);

  const busyDays = useMemo(() => {
    const set = new Set<DayOfWeek>();
    flatDays.forEach((d) => {
      if (d.active && d.dayOfWeek) set.add(d.dayOfWeek as DayOfWeek);
    });
    return set;
  }, [flatDays]);

  const ROW_H = 52;

  // ── Modal state ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDaySlot, setEditingDaySlot] = useState<FlatDoctorSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(initialForm);
  const [createForWholeWeek, setCreateForWholeWeek] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  function openCreateModal() {
    setEditingDaySlot(null);
    setCreateForWholeWeek(false);
    setSelectedDays([]);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(slot: FlatDoctorSchedule) {
    setEditingDaySlot(slot);
    setCreateForWholeWeek(false);
    setSelectedDays([]);
    setForm({
      dayOfWeek: (slot.dayOfWeek as DayOfWeek) ?? DayOfWeek.MONDAY,
      startTime: normalizeScheduleTime(slot.startTime),
      endTime: normalizeScheduleTime(slot.endTime),
      slotDurationMinutes: Number((slot as any).slotDurationMinutes ?? 30),
      active: slot.active !== false,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingDaySlot(null);
    setCreateForWholeWeek(false);
    setSelectedDays([]);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function handleToggleDay(day: DayOfWeek) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!ownDoctorId) {
      toast.error("Foydalanuvchi ID topilmadi. Qaytadan login qiling.");
      return;
    }

    const startTime = normalizeScheduleTime(form.startTime);
    const endTime = normalizeScheduleTime(form.endTime);

    if (!startTime) { toast.warning("Start time is invalid."); return; }
    if (!endTime) { toast.warning("End time is invalid."); return; }
    if (startTime >= endTime) { toast.warning("End time must be later than start time."); return; }

    if (!editingDaySlot && !createForWholeWeek && selectedDays.length === 0) {
      toast.warning("Kamida bitta ish kunini tanlang.");
      return;
    }

    try {
      if (editingDaySlot) {
        await updateScheduleMutation.mutateAsync({
          doctorId: ownDoctorId,
          dayOfWeek: form.dayOfWeek,
          startTime,
          endTime,
          active: Boolean(form.active),
          slotDurationMinutes: Number(form.slotDurationMinutes ?? 30),
        });
        toast.success("Schedule updated successfully.");
      } else if (hasExistingSchedule) {
        const daysToUpdate = createForWholeWeek ? DAYS.map((d) => d.value) : selectedDays;
        for (const day of daysToUpdate) {
          await updateScheduleMutation.mutateAsync({
            doctorId: ownDoctorId,
            dayOfWeek: day,
            startTime,
            endTime,
            active: Boolean(form.active),
            slotDurationMinutes: Number(form.slotDurationMinutes ?? 30),
          });
        }
        toast.success("Schedule yangilandi.");
      } else if (createForWholeWeek) {
        await createWeeklyScheduleMutation.mutateAsync({
          doctorId: ownDoctorId,
          startTime,
          endTime,
          active: Boolean(form.active),
        } as WeeklyDoctorSchedulePayload);
        toast.success("Weekly schedule created successfully.");
      } else {
        const [firstDay] = selectedDays;
        await createScheduleMutation.mutateAsync({
          doctorId: ownDoctorId,
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
          toast.success("Schedule created successfully.");
        }
      }

      closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Schedule saqlashda xatolik yuz berdi."));
    }
  }

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
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add day
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
              onClick={openCreateModal}
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
                { label: "Active slots", value: flatDays.filter((s) => s.active).length, color: "text-emerald-600" },
                {
                  label: "Hours / week",
                  value: `${flatDays.reduce((acc, s) => {
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
                                          onClick={() => openEditModal(slot)}
                                          className="rounded-md p-1 text-blue-500 hover:bg-blue-100"
                                        >
                                          <Edit2 className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
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
        )}
      </main>

      <ScheduleModal
        open={isModalOpen}
        form={form}
        isEditingOne={Boolean(editingDaySlot)}
        isSubmitting={isSubmitting}
        createForWholeWeek={createForWholeWeek}
        onCreateForWholeWeekChange={setCreateForWholeWeek}
        onClose={closeModal}
        onChange={setForm}
        onSubmit={handleSubmit}
        selectedDays={selectedDays}
        onToggleDay={handleToggleDay}
        busyDays={busyDays}
        hasExistingSchedule={hasExistingSchedule}
      />
    </div>
  );
}