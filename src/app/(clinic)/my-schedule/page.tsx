"use client";

/**
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
import { useTranslations } from "next-intl";
import { CalendarDays, Clock, Edit2, Plus, RefreshCcw, Trash2, X } from "lucide-react";
import DentalLoader, { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";

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

// Enum order used to build the localized DAYS array — the i18n key suffix
// under the "days" namespace matches the lowercase enum name.
const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const DAY_I18N_KEY: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "monday",
  [DayOfWeek.TUESDAY]: "tuesday",
  [DayOfWeek.WEDNESDAY]: "wednesday",
  [DayOfWeek.THURSDAY]: "thursday",
  [DayOfWeek.FRIDAY]: "friday",
  [DayOfWeek.SATURDAY]: "saturday",
  [DayOfWeek.SUNDAY]: "sunday",
};

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

type DayDescriptor = { value: DayOfWeek; label: string; short: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeScheduleTime(time?: string | null): string {
  if (!time) return "";
  const value = String(time).trim();
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return value;
}

// Builds the localized DAYS descriptor list from the "myschedule" namespace —
// called inside components (which have access to `t`) rather than at module scope.
function buildLocalizedDays(t: (key: string) => string): DayDescriptor[] {
  return DAY_ORDER.map((value) => ({
    value,
    label: t(`days.${DAY_I18N_KEY[value]}.label`),
    short: t(`days.${DAY_I18N_KEY[value]}.short`),
  }));
}

function getDayShort(day: DayOfWeek | string | undefined, days: DayDescriptor[]): string {
  return days.find((d) => d.value === day)?.short ?? String(day ?? "-");
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

function buildDayRowsFromSchedules(schedules: DoctorSchedule[], ownDoctorId: string, days: DayDescriptor[]): DayRow[] {
  const byDay = new Map<string, DoctorSchedule>();
  schedules
    .filter((s: any) => s.doctorId === ownDoctorId)
    .forEach((s: any) => {
      if (s.dayOfWeek) byDay.set(s.dayOfWeek, s);
    });

  return days.map((d) => {
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
  const t = useTranslations("myschedule");
  const tCommon = useTranslations("common");
  const DAYS = useMemo(() => buildLocalizedDays(t), [t]);

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
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-4 py-6 sm:px-6 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                {hasExistingSchedule ? t("modal.editTitle") : t("modal.createTitle")}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {hasExistingSchedule
                  ? t("modal.editSubtitle")
                  : t("modal.createSubtitle")}
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

        <form onSubmit={onSubmit} className="max-h-[calc(92vh-150px)] space-y-6 overflow-y-auto px-4 py-6 sm:px-6 sm:py-7">
          {hasExistingSchedule ? (
            // ── EDIT: har kuni alohida qator (mavjud holat) ──
            <div className="space-y-2.5">
              {DAYS.map((day, index) => {
                const row = dayRows[index];
                return (
                  <div
                    key={day.value}
                    className={`flex flex-wrap items-center gap-2 rounded-2xl border-2 p-3 transition sm:gap-3 ${
                      row.active ? "border-primary-blue/20 bg-primary-blue/10" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <label className="flex w-full shrink-0 cursor-pointer items-center gap-2.5 sm:w-28">
                      <input
                        type="checkbox"
                        checked={row.active}
                        onChange={(e) => updateRow(index, { active: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                      />
                      <span className="text-sm font-extrabold text-slate-900">{day.label}</span>
                    </label>

                    <input
                      type="time"
                      value={row.startTime}
                      disabled={!row.active}
                      onChange={(e) => updateRow(index, { startTime: normalizeScheduleTime(e.target.value) })}
                      className="min-w-[100px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <span className="text-xs text-slate-400">—</span>
                    <input
                      type="time"
                      value={row.endTime}
                      disabled={!row.active}
                      onChange={(e) => updateRow(index, { endTime: normalizeScheduleTime(e.target.value) })}
                      className="min-w-[100px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
                    createMode === "WEEKLY" ? "bg-primary-blue text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {t("modal.modeWeekly")}
                </button>
                <button
                  type="button"
                  onClick={() => onCreateModeChange("DAILY")}
                  className={`flex-1 py-3 transition ${
                    createMode === "DAILY" ? "bg-primary-blue text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {t("modal.modeDaily")}
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
                        {t("modal.durationUnit", { minutes: duration })}
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

          <div
            className={`flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center ${
              hasExistingSchedule ? "sm:justify-between" : "sm:justify-end"
            }`}
          >
            {hasExistingSchedule && (
              <button
                type="button"
                onClick={onDeleteSchedule}
                disabled={isDeleting || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isDeleting ? <DentalLoaderIcon className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                {t("modal.deleteSchedule")}
              </button>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                {tCommon("actions.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting && <DentalLoaderIcon className="h-4 w-4" />}
                {hasExistingSchedule ? t("modal.saveSchedule") : t("modal.createScheduleButton")}
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
  const t = useTranslations("myschedule");
  const DAYS = useMemo(() => buildLocalizedDays(t), [t]);

  const toast = useToast();

  const currentUser = useAuthStore((s) => s.user);
  const isDoctorRole = useAuthStore((s) => s.isDoctor());
  const ownDoctorId = currentUser
    ? (currentUser as any)?.id ?? (currentUser as any)?._id ?? ""
    : "";
  const ownDoctorName =
    (currentUser as any)?.firstName || (currentUser as any)?.lastName
      ? `${(currentUser as any)?.firstName ?? ""} ${(currentUser as any)?.lastName ?? ""}`.trim()
      : (currentUser as any)?.email || t("meFallback");

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
      setDayRows(buildDayRowsFromSchedules(schedules as any[], ownDoctorId, DAYS));
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
      toast.error(t("toast.scheduleIdNotFound"));
      return;
    }
    if (!window.confirm(t("toast.confirmDelete"))) return;

    try {
      await deleteScheduleMutation.mutateAsync(ownScheduleId);
      toast.success(t("toast.deleted"));
      closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.deleteError")));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!ownDoctorId) {
      toast.error(t("toast.userIdNotFound"));
      return;
    }

    if (hasExistingSchedule) {
      // ── EDIT: PUT /doctor-schedules/by-day (doctorId yuborilmaydi) ──
      for (const row of dayRows) {
        if (row.active && (!row.startTime || !row.endTime)) {
          toast.warning(t("toast.timeMissingForDay", { day: getDayShort(row.dayOfWeek, DAYS) }));
          return;
        }
        if (row.active && row.startTime >= row.endTime) {
          toast.warning(t("toast.endBeforeStartForDay", { day: getDayShort(row.dayOfWeek, DAYS) }));
          return;
        }
      }

      try {
        await updateScheduleByDayMutation.mutateAsync({ days: dayRows });
        toast.success(t("toast.saved"));
        closeModal();
      } catch (err) {
        toast.error(getApiErrorMessage(err, t("toast.saveError")));
      }
      return;
    }

    // ── CREATE: Weekly yoki Daily (doctorId = o'zining ID'si) ──
    if (!createStartTime || !createEndTime) {
      toast.warning(t("toast.timeMissing"));
      return;
    }
    if (createStartTime >= createEndTime) {
      toast.warning(t("toast.endBeforeStart"));
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
          toast.warning(t("toast.selectAtLeastOneDay"));
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
      toast.success(t("toast.created"));
      closeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toast.createError")));
    }
  }

  const isSubmitting =
    updateScheduleByDayMutation.isPending ||
    createScheduleMutation.isPending ||
    createWeeklyScheduleMutation.isPending;

  return (
    <div className="min-h-screen from-slate-50 via-blue-50 to-indigo-50">
      <div className="relative top-0 z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-blue text-white shadow-lg sm:h-11 sm:w-11">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold text-slate-900 sm:text-2xl">{t("header.title")}</h1>
                <p className="text-sm font-medium text-slate-500">
                  {t("header.subtitle")}
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
                {t("actions.refresh")}
              </button>
              <button
                type="button"
                onClick={openEditor}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 sm:flex-none"
              >
                <Edit2 className="h-4 w-4" />
                {t("actions.editSchedule")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {!isDoctorRole ? (
          <div className="rounded-3xl border border-amber-100 bg-white px-4 py-16 text-center shadow-sm sm:px-6">
            <p className="text-lg font-extrabold text-slate-900">{t("accessDenied.title")}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {t("accessDenied.description")}
            </p>
          </div>
        ) : isLoading ? (
          <DentalLoader fullScreen={false} text={t("loading")} />
        ) : isError ? (
          <div className="rounded-3xl border border-red-100 bg-white px-4 py-16 text-center shadow-sm sm:px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-2xl font-extrabold text-red-600">!</div>
            <p className="text-lg font-extrabold text-slate-900">{t("error.title")}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {getApiErrorMessage(error, t("error.fallback"))}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-6 rounded-xl bg-primary-blue px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-blue-dark"
            >
              {t("error.retry")}
            </button>
          </div>
        ) : !hasExistingSchedule ? (
          <div className="rounded-3xl border border-slate-100 bg-white px-4 py-20 text-center shadow-sm sm:px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary-blue/5 text-primary-blue">
              <CalendarDays className="h-7 w-7" />
            </div>
            <p className="text-lg font-extrabold text-slate-900">{t("empty.title")}</p>
            <p className="mt-2 text-sm text-slate-500">{t("empty.description")}</p>
            <button
              type="button"
              onClick={openEditor}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-blue px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-primary-blue-dark"
            >
              <Plus className="h-4 w-4" />
              {t("empty.cta")}
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-blue/10 text-xs font-extrabold text-primary-blue">
                {getDoctorInitials(ownDoctorName)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{ownDoctorName}</p>
                <p className="text-xs text-slate-500">{t("doctorCard.subtitle")}</p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { label: t("stats.workDays"), value: byDay.size, color: "text-slate-900" },
                { label: t("stats.activeSlots"), value: ownSchedules.length, color: "text-emerald-600" },
                {
                  label: t("stats.hoursPerWeek"),
                  value: t("stats.hoursValue", {
                    hours: ownSchedules.reduce((acc: number, s: any) => {
                      const sh = parseInt(normalizeScheduleTime(s.startTime));
                      const eh = parseInt(normalizeScheduleTime(s.endTime));
                      return acc + (isNaN(sh) || isNaN(eh) ? 0 : eh - sh);
                    }, 0),
                  }),
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
                                    className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border-l-2 border-primary-blue bg-primary-blue/5"
                                    style={{ top: 2, height: spanH * ROW_H - 4 }}
                                  >
                                    <div className="flex h-full flex-col justify-between p-2">
                                      <p className="text-[10px] font-extrabold text-primary-blue">
                                        {start} – {end}
                                      </p>
                                      <span className="w-fit rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                                        {t("table.active")}
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
                {t("legend.workHours")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-50" />
                {t("legend.dayOff")}
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