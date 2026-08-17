"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  LayoutGrid,
  List,
  RefreshCcw,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import DentalLoader from "@/src/components/ui/DentalLoader";

import { useTodayInProgressAppointments } from "@/src/features/treatments/hooks/useTodayInProgressAppointments";
import type { TreatmentAppointment } from "@/src/types/treatment-appointment.types";

type ViewMode = "CARD" | "LIST";

const VIEW_MODE_STORAGE_KEY = "treatments:viewMode";

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "CARD";

  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "LIST" ? "LIST" : "CARD";
  } catch {
    return "CARD";
  }
}

function getId(item?: { id?: string; _id?: string } | null) {
  return item?.id || item?._id || "";
}

function getPersonName(person?: any, fallback = "Noma'lum") {
  if (!person) return fallback;

  const fullName = person.fullName || person.name;
  if (fullName) return fullName;

  const firstName = person.firstName || "";
  const lastName = person.lastName || "";
  const name = `${firstName} ${lastName}`.trim();

  return name || fallback;
}

function getPatientId(appointment: TreatmentAppointment) {
  return (
    appointment.patientId ||
    appointment.patient?.id ||
    appointment.patient?._id ||
    ""
  );
}

/** "13:00:00" -> "13:00" ; "2026-08-06T13:00:00Z" -> "13:00" (lokal) */
function formatTimeValue(time: unknown): string {
  const value = String(time ?? "").trim();

  if (!value) return "";

  if (value.includes("T")) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const timePart = value.split("T")[1];
    return timePart ? timePart.slice(0, 5) : "";
  }

  if (/^\d{1,2}:\d{2}/.test(value)) {
    return value.padStart(5, "0").slice(0, 5);
  }

  return value;
}

function formatAppointmentTime(appointment: TreatmentAppointment) {
  const start = formatTimeValue(appointment.startTime);
  const end = formatTimeValue((appointment as any).endTime);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;

  return "--:--";
}

function getReason(appointment: TreatmentAppointment, fallback: string) {
  const reason =
    appointment.reason || appointment.complaint || appointment.notes || "";

  return String(reason).trim() || fallback;
}

export default function TreatmentsPage() {
  const t = useTranslations("treatments");
  const [search, setSearch] = useState("");
  const [viewMode, setViewModeState] = useState<ViewMode>("CARD");

  useEffect(() => {
    setViewModeState(getStoredViewMode());
  }, []);

  function setViewMode(mode: ViewMode) {
    setViewModeState(mode);

    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      /* private mode — e'tiborsiz qoldiramiz */
    }
  }

  const { today, appointments, isLoading, isFetching, error, refetch } =
    useTodayInProgressAppointments();

  // Service allaqachon vaqt bo'yicha to'g'ri sortlagan.
  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return appointments;

    return appointments.filter((appointment) => {
      const patientName = getPersonName(appointment.patient, "").toLowerCase();
      const reason = getReason(appointment, "").toLowerCase();
      const appointmentId = getId(appointment).toLowerCase();
      const time = formatAppointmentTime(appointment).toLowerCase();

      return (
        patientName.includes(q) ||
        reason.includes(q) ||
        appointmentId.includes(q) ||
        time.includes(q)
      );
    });
  }, [appointments, search]);

  function renderQueueActionButton(patientId: string, appointmentId: string) {
    const treatmentHref =
      patientId && appointmentId
        ? `/treatments/${patientId}?appointmentId=${appointmentId}`
        : "#";

    return patientId && appointmentId ? (
      <Link
        href={treatmentHref}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-primary-blue px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-primary-blue-dark"
      >
        {t("inProgress.open")}
        <ArrowRight size={16} className="shrink-0" />
      </Link>
    ) : (
      <button
        type="button"
        disabled
        className="inline-flex cursor-not-allowed items-center justify-center whitespace-nowrap rounded-2xl bg-slate-200 px-4 py-2.5 text-sm font-black text-slate-500"
      >
        {t("inProgress.noId")}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        {/* ---------------- Header ---------------- */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-primary-blue/10 blur-3xl" />
          <div className="absolute bottom-0 right-44 h-32 w-32 rounded-full bg-cyan-100 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-blue/5 px-4 py-2 text-sm font-extrabold text-primary-blue ring-1 ring-primary-blue/10">
                <Activity size={18} className="shrink-0" />
                {t("inProgress.badge")}
              </div>

              <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {t("inProgress.title")}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {t.rich("inProgress.subtitle", { b: (chunks) => <b>{chunks}</b> })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw
                size={18}
                className={`shrink-0 ${isFetching ? "animate-spin" : ""}`}
              />
              {t("inProgress.refresh")}
            </button>
          </div>
        </div>

        {/* ---------------- Stat cards ---------------- */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-sm font-bold text-slate-500">
                {t("inProgress.todayLabel")}
              </p>
              <div className="shrink-0 rounded-2xl bg-primary-blue/5 p-3 text-primary-blue">
                <CalendarDays size={20} />
              </div>
            </div>

            <p className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">
              {today}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-sm font-bold text-slate-500">{t("inProgress.inProgressLabel")}</p>
              <div className="shrink-0 rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Clock3 size={20} />
              </div>
            </div>

            <p className="mt-3 text-xl font-black text-emerald-600 sm:text-2xl">
              {appointments.length}
            </p>
          </div>

          <div className="col-span-2 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-sm font-bold text-slate-500">
                {t("inProgress.visibleLabel")}
              </p>
              <div className="shrink-0 rounded-2xl bg-purple-50 p-3 text-purple-600">
                <Users size={20} />
              </div>
            </div>

            <p className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">
              {filteredAppointments.length}
            </p>
          </div>
        </div>

        {/* ---------------- Queue ---------------- */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {/* ⬇️ TUZATILGAN TOOLBAR */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-950 sm:text-xl">
                {t("inProgress.queueTitle")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t("inProgress.queueSubtitle")}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
              {/* View toggle — hech qachon siqilmaydi */}
              <div className="flex shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("CARD")}
                  className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-black transition sm:flex-none sm:px-4 ${
                    viewMode === "CARD"
                      ? "bg-primary-blue text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <LayoutGrid size={17} className="shrink-0" />
                  {t("inProgress.cardView")}
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-black transition sm:flex-none sm:px-4 ${
                    viewMode === "LIST"
                      ? "bg-primary-blue text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <List size={17} className="shrink-0" />
                  {t("inProgress.listView")}
                </button>
              </div>

              {/* Qidiruv — qolgan joyni egallaydi, qattiq kenglik yo'q */}
              <div className="relative w-full min-w-0 sm:flex-1 xl:w-[320px] xl:flex-none">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("inProgress.searchPlaceholder")}
                  className="w-full truncate rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-primary-blue/5"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5 text-red-700">
              <div className="flex items-center gap-2 font-black">
                <AlertCircle size={20} className="shrink-0" />
                {t("inProgress.errorTitle")}
              </div>

              <p className="mt-2 text-sm font-semibold text-red-600">
                {t("inProgress.errorSubtitle")}
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 py-16">
                <DentalLoader fullScreen={false} text={t("inProgress.loading")} />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
                  <CalendarDays size={28} />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950">
                  {t("inProgress.emptyTitle")}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {t("inProgress.emptySubtitle")}
                </p>
              </div>
            ) : viewMode === "CARD" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredAppointments.map((appointment, index) => {
                  const appointmentId = getId(appointment);
                  const patientId = getPatientId(appointment);

                  const patientName = getPersonName(
                    appointment.patient,
                    t("inProgress.unknownPatient")
                  );

                  const treatmentHref =
                    patientId && appointmentId
                      ? `/treatments/${patientId}?appointmentId=${appointmentId}`
                      : "#";

                  return (
                    <div
                      key={`${appointmentId || patientId}-${index}`}
                      className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-blue/20 hover:shadow-lg hover:shadow-primary-blue/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-blue text-sm font-black text-white shadow-sm">
                            #{index + 1}
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-words text-base font-black text-slate-950">
                              {patientName}
                            </h3>

                            <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-700">
                              <Clock3 size={16} className="shrink-0 text-primary-blue" />
                              {formatAppointmentTime(appointment)}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                          {t("inProgress.inProgressLabel")}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {t("table.date")}
                          </p>

                          <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-800">
                            <CalendarDays size={16} className="shrink-0" />
                            {String(appointment.appointmentDate || today).slice(0, 10)}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {t("table.time")}
                          </p>

                          <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-800">
                            <Clock3 size={16} className="shrink-0" />
                            {formatAppointmentTime(appointment)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          {t("table.reason")}
                        </p>

                        <p className="mt-1 whitespace-pre-line break-words text-sm font-bold text-slate-700">
                          {getReason(appointment, t("inProgress.defaultReason"))}
                        </p>
                      </div>

                      <div className="mt-5 flex justify-end">
                        {patientId && appointmentId ? (
                          <Link
                            href={treatmentHref}
                            className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-primary-blue px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-blue/20 transition hover:bg-primary-blue-dark sm:w-auto"
                          >
                            {t("inProgress.openTreatment")}
                            <ArrowRight size={18} className="shrink-0" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500 sm:w-auto"
                          >
                            {t("inProgress.noIds")}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                {/* Mobile card list */}
                <div className="divide-y divide-slate-100 bg-white md:hidden">
                  {filteredAppointments.map((appointment, index) => {
                    const appointmentId = getId(appointment);
                    const patientId = getPatientId(appointment);

                    const patientName = getPersonName(
                      appointment.patient,
                      t("inProgress.unknownPatient")
                    );

                    return (
                      <div
                        key={`${appointmentId || patientId}-${index}`}
                        className="flex flex-col gap-3 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-blue text-xs font-black text-white">
                            #{index + 1}
                          </span>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/5 text-primary-blue">
                            <UserRound size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-950">
                              {patientName}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-black text-slate-500">
                              <Clock3 size={14} className="shrink-0 text-primary-blue" />
                              {formatAppointmentTime(appointment)}
                            </p>
                          </div>

                          <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">
                            {t("inProgress.inProgressLabel")}
                          </span>
                        </div>

                        <p className="line-clamp-2 text-sm font-bold text-slate-700">
                          {getReason(appointment, t("inProgress.defaultReason"))}
                        </p>

                        <div className="flex justify-end">
                          {renderQueueActionButton(patientId, appointmentId)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[820px] border-collapse text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          {t("table.number")}
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          {t("table.time")}
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          {t("table.patient")}
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          {t("table.reason")}
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          {t("table.status")}
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                          {t("table.action")}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredAppointments.map((appointment, index) => {
                        const appointmentId = getId(appointment);
                        const patientId = getPatientId(appointment);

                        const patientName = getPersonName(
                          appointment.patient,
                          t("inProgress.unknownPatient")
                        );

                        return (
                          <tr
                            key={`${appointmentId || patientId}-${index}`}
                            className="transition hover:bg-primary-blue/10"
                          >
                            <td className="px-5 py-4">
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-blue text-xs font-black text-white">
                                #{index + 1}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 whitespace-nowrap text-sm font-black text-slate-900">
                                <Clock3 size={16} className="shrink-0 text-primary-blue" />
                                {formatAppointmentTime(appointment)}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/5 text-primary-blue">
                                  <UserRound size={20} />
                                </div>

                                <p className="text-sm font-black text-slate-950">
                                  {patientName}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="max-w-[260px] truncate text-sm font-bold text-slate-700">
                                {getReason(appointment, t("inProgress.defaultReason"))}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                {t("inProgress.inProgressLabel")}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              {renderQueueActionButton(patientId, appointmentId)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}