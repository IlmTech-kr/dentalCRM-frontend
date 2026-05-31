"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  LayoutGrid,
  List,
  Loader2,
  RefreshCcw,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import { useTodayInProgressAppointments } from "@/src/features/treatments/hooks/useTodayInProgressAppointments";
import type { TreatmentAppointment } from "@/src/types/treatment-appointment.types";

type ViewMode = "CARD" | "LIST";

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

function formatAppointmentTime(appointment: TreatmentAppointment) {
  const startTime = appointment.startTime || "";
  const endTime = (appointment as any).endTime || "";

  const format = (time: string) => {
    if (!time) return "";

    const value = String(time).trim();

    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
      return value.slice(0, 5);
    }

    if (/^\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    if (value.includes("T")) {
      const timePart = value.split("T")[1];
      return timePart ? timePart.slice(0, 5) : "";
    }

    return value;
  };

  const start = format(String(startTime));
  const end = format(String(endTime));

  if (start && end) return `${start} - ${end}`;
  if (start) return start;

  return "--:--";
}

function getStartTimeSortValue(appointment: TreatmentAppointment) {
  const startTime = appointment.startTime || "";

  if (!startTime) return "99:99";

  const value = String(startTime).trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (value.includes("T")) {
    const timePart = value.split("T")[1];
    return timePart ? timePart.slice(0, 5) : "99:99";
  }

  return value;
}

function getReason(appointment: TreatmentAppointment) {
  return (
    appointment.reason ||
    appointment.complaint ||
    appointment.notes ||
    "Ko‘rik / davolanish"
  );
}

export default function TreatmentsPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("CARD");

  const { today, appointments, isLoading, isFetching, error, refetch } =
    useTodayInProgressAppointments();

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aTime = getStartTimeSortValue(a);
      const bTime = getStartTimeSortValue(b);

      return aTime.localeCompare(bTime);
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return sortedAppointments;

    return sortedAppointments.filter((appointment) => {
      const patientName = getPersonName(appointment.patient, "").toLowerCase();
      const reason = getReason(appointment).toLowerCase();
      const appointmentId = getId(appointment).toLowerCase();
      const time = formatAppointmentTime(appointment).toLowerCase();

      return (
        patientName.includes(q) ||
        reason.includes(q) ||
        appointmentId.includes(q) ||
        time.includes(q)
      );
    });
  }, [sortedAppointments, search]);

  return (
    <div className="min-h-screen bg-[#F7FAFC] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute bottom-0 right-44 h-32 w-32 rounded-full bg-cyan-100 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 ring-1 ring-blue-100">
                <Activity size={18} />
                Treatment queue
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Bugungi davolanishdagi appointmentlar
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Bu yerda faqat bugungi sana bo‘yicha statusi{" "}
                <b>IN_PROGRESS</b> bo‘lgan appointmentlar chiqadi. Appointmentlar
                vaqtiga qarab tartiblangan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw
                size={18}
                className={isFetching ? "animate-spin" : ""}
              />
              Yangilash
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">Bugungi sana</p>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <CalendarDays size={20} />
              </div>
            </div>

            <p className="mt-3 text-2xl font-black text-slate-950">{today}</p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">IN_PROGRESS</p>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Clock3 size={20} />
              </div>
            </div>

            <p className="mt-3 text-2xl font-black text-emerald-600">
              {appointments.length}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">Ko‘rinayotgan</p>
              <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
                <Users size={20} />
              </div>
            </div>

            <p className="mt-3 text-2xl font-black text-slate-950">
              {filteredAppointments.length}
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Davolanish navbati
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Order number vaqtga qarab beriladi: eng erta vaqt #1 bo‘ladi.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("CARD")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
                    viewMode === "CARD"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <LayoutGrid size={17} />
                  Card view
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
                    viewMode === "LIST"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <List size={17} />
                  List view
                </button>
              </div>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Patient, vaqt yoki sabab..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 md:w-[360px]"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5 text-red-700">
              <div className="flex items-center gap-2 font-black">
                <AlertCircle size={20} />
                Appointmentlarni olishda xatolik
              </div>

              <p className="mt-2 text-sm font-semibold text-red-600">
                Endpoint yoki tenant subdomainni tekshiring.
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 py-16">
                <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500">
                  <Loader2 size={20} className="animate-spin" />
                  Bugungi appointmentlar yuklanmoqda...
                </div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
                  <CalendarDays size={28} />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950">
                  Bugun IN_PROGRESS appointment yo‘q
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Appointment statusi IN_PROGRESS bo‘lganda shu yerda
                  ko‘rinadi.
                </p>
              </div>
            ) : viewMode === "CARD" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredAppointments.map((appointment, index) => {
                  const appointmentId = getId(appointment);
                  const patientId = getPatientId(appointment);

                  const patientName = getPersonName(
                    appointment.patient,
                    "Noma'lum bemor"
                  );

                  const treatmentHref =
                    patientId && appointmentId
                      ? `/treatments/${patientId}?appointmentId=${appointmentId}`
                      : "#";

                  return (
                    <div
                      key={appointmentId || patientId}
                      className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/60"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm">
                            #{index + 1}
                          </div>

                          <div>
                            <h3 className="text-base font-black text-slate-950">
                              {patientName}
                            </h3>

                            <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-700">
                              <Clock3 size={16} className="text-blue-600" />
                              {formatAppointmentTime(appointment)}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                          IN_PROGRESS
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Sana
                          </p>

                          <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-800">
                            <CalendarDays size={16} />
                            {appointment.appointmentDate || today}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Vaqt
                          </p>

                          <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-800">
                            <Clock3 size={16} />
                            {formatAppointmentTime(appointment)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Sabab
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {getReason(appointment)}
                        </p>
                      </div>

                      <div className="mt-5 flex justify-end">
                        {patientId && appointmentId ? (
                          <Link
                            href={treatmentHref}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                          >
                            Davolashni ochish
                            <ArrowRight size={18} />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500"
                          >
                            Patient yoki Appointment ID yo‘q
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          #
                        </th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          Vaqt
                        </th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          Patient
                        </th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          Sabab
                        </th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
                          Status
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredAppointments.map((appointment, index) => {
                        const appointmentId = getId(appointment);
                        const patientId = getPatientId(appointment);

                        const patientName = getPersonName(
                          appointment.patient,
                          "Noma'lum bemor"
                        );

                        const treatmentHref =
                          patientId && appointmentId
                            ? `/treatments/${patientId}?appointmentId=${appointmentId}`
                            : "#";

                        return (
                          <tr
                            key={appointmentId || patientId}
                            className="transition hover:bg-blue-50/40"
                          >
                            <td className="px-5 py-4">
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white">
                                #{index + 1}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                                <Clock3 size={16} className="text-blue-600" />
                                {formatAppointmentTime(appointment)}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                  <UserRound size={20} />
                                </div>

                                <div>
                                  <p className="text-sm font-black text-slate-950">
                                    {patientName}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="max-w-[260px] truncate text-sm font-bold text-slate-700">
                                {getReason(appointment)}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                IN_PROGRESS
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              {patientId && appointmentId ? (
                                <Link
                                  href={treatmentHref}
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                                >
                                  Ochish
                                  <ArrowRight size={16} />
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-4 py-2.5 text-sm font-black text-slate-500"
                                >
                                  ID yo‘q
                                </button>
                              )}
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