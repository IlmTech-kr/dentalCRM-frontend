/**
 * Har bir namespace/locale statik import qilinadi (dinamik
 * import(`.../${locale}/${ns}.json`) emas) — Next.js 16 default
 * bundleri (Turbopack) template-literal asosidagi dinamik import
 * glob'larini har doim ham to'g'ri hal qilavermaydi. Fayllar juda
 * kichik bo'lgani uchun barcha tillarni bitta bundle'ga qo'shish
 * arzon, va bu async loading/race-condition murakkabligini yo'qotadi.
 *
 * Yangi namespace qo'shish shu faylda bitta joyda amalga oshiriladi.
 */

import type { Locale } from "./storage";

import uzCommon from "../../../messages/uz/common.json";
import uzAuth from "../../../messages/uz/auth.json";
import uzDashboard from "../../../messages/uz/dashboard.json";
import uzCalendar from "../../../messages/uz/calendar.json";
import uzMyschedule from "../../../messages/uz/myschedule.json";
import uzPatients from "../../../messages/uz/patients.json";
import uzAppointments from "../../../messages/uz/appointments.json";
import uzTreatments from "../../../messages/uz/treatments.json";
import uzDoctors from "../../../messages/uz/doctors.json";
import uzProcedures from "../../../messages/uz/procedures.json";
import uzExpenses from "../../../messages/uz/expenses.json";
import uzPayments from "../../../messages/uz/payments.json";
import uzSettings from "../../../messages/uz/settings.json";
import uzSuperadmin from "../../../messages/uz/superadmin.json";
import uzMarketing from "../../../messages/uz/marketing.json";
import uzLayout from "../../../messages/uz/layout.json";

import ruCommon from "../../../messages/ru/common.json";
import ruAuth from "../../../messages/ru/auth.json";
import ruDashboard from "../../../messages/ru/dashboard.json";
import ruCalendar from "../../../messages/ru/calendar.json";
import ruMyschedule from "../../../messages/ru/myschedule.json";
import ruPatients from "../../../messages/ru/patients.json";
import ruAppointments from "../../../messages/ru/appointments.json";
import ruTreatments from "../../../messages/ru/treatments.json";
import ruDoctors from "../../../messages/ru/doctors.json";
import ruProcedures from "../../../messages/ru/procedures.json";
import ruExpenses from "../../../messages/ru/expenses.json";
import ruPayments from "../../../messages/ru/payments.json";
import ruSettings from "../../../messages/ru/settings.json";
import ruSuperadmin from "../../../messages/ru/superadmin.json";
import ruMarketing from "../../../messages/ru/marketing.json";
import ruLayout from "../../../messages/ru/layout.json";

import enCommon from "../../../messages/en/common.json";
import enAuth from "../../../messages/en/auth.json";
import enDashboard from "../../../messages/en/dashboard.json";
import enCalendar from "../../../messages/en/calendar.json";
import enMyschedule from "../../../messages/en/myschedule.json";
import enPatients from "../../../messages/en/patients.json";
import enAppointments from "../../../messages/en/appointments.json";
import enTreatments from "../../../messages/en/treatments.json";
import enDoctors from "../../../messages/en/doctors.json";
import enProcedures from "../../../messages/en/procedures.json";
import enExpenses from "../../../messages/en/expenses.json";
import enPayments from "../../../messages/en/payments.json";
import enSettings from "../../../messages/en/settings.json";
import enSuperadmin from "../../../messages/en/superadmin.json";
import enMarketing from "../../../messages/en/marketing.json";
import enLayout from "../../../messages/en/layout.json";

export type Messages = Record<string, Record<string, unknown>>;

export const MESSAGES: Record<Locale, Messages> = {
  uz: {
    common: uzCommon,
    auth: uzAuth,
    dashboard: uzDashboard,
    calendar: uzCalendar,
    myschedule: uzMyschedule,
    patients: uzPatients,
    appointments: uzAppointments,
    treatments: uzTreatments,
    doctors: uzDoctors,
    procedures: uzProcedures,
    expenses: uzExpenses,
    payments: uzPayments,
    settings: uzSettings,
    superadmin: uzSuperadmin,
    marketing: uzMarketing,
    layout: uzLayout,
  },
  ru: {
    common: ruCommon,
    auth: ruAuth,
    dashboard: ruDashboard,
    calendar: ruCalendar,
    myschedule: ruMyschedule,
    patients: ruPatients,
    appointments: ruAppointments,
    treatments: ruTreatments,
    doctors: ruDoctors,
    procedures: ruProcedures,
    expenses: ruExpenses,
    payments: ruPayments,
    settings: ruSettings,
    superadmin: ruSuperadmin,
    marketing: ruMarketing,
    layout: ruLayout,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    calendar: enCalendar,
    myschedule: enMyschedule,
    patients: enPatients,
    appointments: enAppointments,
    treatments: enTreatments,
    doctors: enDoctors,
    procedures: enProcedures,
    expenses: enExpenses,
    payments: enPayments,
    settings: enSettings,
    superadmin: enSuperadmin,
    marketing: enMarketing,
    layout: enLayout,
  },
};
