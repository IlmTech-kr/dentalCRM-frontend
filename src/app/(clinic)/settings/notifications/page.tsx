"use client";

import { useState } from "react";
import {
  BellRing,
  Clock3,
  MessageSquareText,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useClinicSettings, useSaveClinicSettings } from "@/src/features/settings/hooks/useSettings";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { useAuthStore } from "@/src/store/auth.store";
import type {
  ClinicSettings,
  ReminderRuleSettings,
  SmsEventSettings,
} from "@/src/types/settings.types";

const PRESETS = [60, 120, 240, 360, 720, 1440, 2880, 4320];

const APPOINTMENT_CREATED_TEMPLATE =
  "Assalomu alaykum, {patientName}! Siz {clinicName} klinikasida shifokor {doctorName} qabuliga {date} soat {time} ga muvaffaqiyatli yozildingiz.";
const PAYMENT_RECEIVED_TEMPLATE =
  "Hurmatli {patientName}! {clinicName} klinikasida ko'rsatilgan stomatologiya xizmatlari uchun {amount} so'm miqdoridagi to'lovingiz qabul qilindi.";
const APPOINTMENT_REMINDER_TEMPLATE =
  "Assalomu alaykum, {patientName}! {clinicName} klinikasidagi keyingi qabul {remainingTime}dan keyin, {date} soat {time} da bo'ladi. Shifokoringiz: {doctorName}.";

const EMPTY: ClinicSettings = {
  timezone: "Asia/Tashkent",
  sms: {
    enabled: true,
    quietHours: { enabled: false, start: "21:00", end: "08:00" },
    appointmentCreated: { enabled: true, template: APPOINTMENT_CREATED_TEMPLATE },
    paymentReceived: { enabled: true, template: PAYMENT_RECEIVED_TEMPLATE },
    appointmentReminders: [],
  },
};

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/30 focus-visible:ring-offset-2 ${
        checked ? "bg-primary-blue" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function NotificationToggleRow({
  title,
  value,
  onChange,
}: {
  title: string;
  value: SmsEventSettings;
  onChange: (value: SmsEventSettings) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
      <h3 className="min-w-0 text-sm font-semibold text-slate-900">{title}</h3>
      <Switch
        checked={value.enabled}
        onChange={(enabled) => onChange({ ...value, enabled })}
        label={`${title} SMS xabarini yoqish`}
      />
    </div>
  );
}

function leadTimeLabel(minutes: number) {
  return minutes >= 1440 ? `${minutes / 1440} kun oldin` : `${minutes / 60} soat oldin`;
}

export default function NotificationsPage() {
  const admin = useAuthStore((state) => state.isClinicAdmin());
  const { data, isLoading, error } = useClinicSettings(admin);

  if (!admin) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        Bu bo‘lim faqat klinika administratori uchun.
      </div>
    );
  }

  if (isLoading) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;

  if (error) {
    return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error.message}</div>;
  }

  return <NotificationsForm initialSettings={data ?? EMPTY} />;
}

function NotificationsForm({ initialSettings }: { initialSettings: ClinicSettings }) {
  const save = useSaveClinicSettings();
  const toast = useToast();
  const [form, setForm] = useState<ClinicSettings>(() => structuredClone(initialSettings));

  const sms = form.sms;

  function patchSms(patch: Partial<ClinicSettings["sms"]>) {
    setForm((current) => ({ ...current, sms: { ...current.sms, ...patch } }));
  }

  function addReminder() {
    if (sms.appointmentReminders.length >= 3) return;
    const usedLeadTimes = new Set(sms.appointmentReminders.map((rule) => rule.leadTimeMinutes));
    const leadTimeMinutes = PRESETS.find((preset) => !usedLeadTimes.has(preset)) ?? 1440;
    patchSms({
      appointmentReminders: [
        ...sms.appointmentReminders,
        {
          enabled: true,
          leadTimeMinutes,
          template: APPOINTMENT_REMINDER_TEMPLATE,
        },
      ],
    });
  }

  function patchRule(index: number, patch: Partial<ReminderRuleSettings>) {
    patchSms({
      appointmentReminders: sms.appointmentReminders.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...patch } : rule,
      ),
    });
  }

  async function submit() {
    try {
      await save.mutateAsync(form);
      toast.success("SMS sozlamalari saqlandi");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Saqlashda xatolik");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">SMS sozlamalari</h1>
        <p className="mt-1 text-sm text-slate-500">Avtomatik xabarlar va yuborish vaqtlarini boshqaring.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3.5">
            <span className="rounded-xl bg-primary-blue/10 p-2.5 text-primary-blue">
              <BellRing size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">SMS yuborish</h2>
              <p className="mt-0.5 text-xs text-slate-500">Barcha avtomatik xabarlarni boshqaradi</p>
            </div>
          </div>
          <Switch
            checked={sms.enabled}
            onChange={(enabled) => patchSms({ enabled })}
            label="Barcha avtomatik SMS xabarlarini yoqish"
          />
        </div>
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          <NotificationToggleRow
            title="Qabul yaratildi"
            value={sms.appointmentCreated}
            onChange={(appointmentCreated) => patchSms({ appointmentCreated })}
          />
          <NotificationToggleRow
            title="To‘lov qabul qilindi"
            value={sms.paymentReceived}
            onChange={(paymentReceived) => patchSms({ paymentReceived })}
          />
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <label className="text-sm font-semibold text-slate-900">Klinika vaqt mintaqasi</label>
          <select
            value={form.timezone}
            onChange={(event) => setForm({ ...form, timezone: event.target.value })}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/10"
          >
            <option>Asia/Tashkent</option>
            <option>Asia/Samarkand</option>
            <option>Asia/Seoul</option>
            <option>UTC</option>
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-900">Tinch vaqt</label>
            <Switch
              checked={sms.quietHours.enabled}
              onChange={(enabled) =>
                patchSms({ quietHours: { ...sms.quietHours, enabled } })
              }
              label="Tinch vaqtni yoqish"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              aria-label="Tinch vaqt boshlanishi"
              type="time"
              value={sms.quietHours.start}
              onChange={(event) =>
                patchSms({ quietHours: { ...sms.quietHours, start: event.target.value } })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
            />
            <Clock3 className="text-slate-400" />
            <input
              aria-label="Tinch vaqt tugashi"
              type="time"
              value={sms.quietHours.end}
              onChange={(event) =>
                patchSms({ quietHours: { ...sms.quietHours, end: event.target.value } })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 px-5 py-5 sm:px-6">
            <span className="rounded-xl bg-primary-blue/10 p-2.5 text-primary-blue">
              <MessageSquareText size={20} />
            </span>
            <h2 className="font-semibold text-slate-900">Qabul eslatmalari</h2>
          </div>
          <button
            type="button"
            onClick={addReminder}
            disabled={sms.appointmentReminders.length >= 3}
            className="mr-5 inline-flex items-center gap-1.5 rounded-xl bg-primary-blue px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary-blue/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:mr-6"
          >
            <Plus size={16} /> Eslatma
          </button>
        </div>

        {sms.appointmentReminders.length === 0 ? (
          <div className="border-t border-slate-100 px-5 py-10 text-center text-sm text-slate-400 sm:px-6">
            Eslatma qo‘shilmagan
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {sms.appointmentReminders.map((reminder, index) => (
              <div
                key={reminder.ruleId ?? index}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold tabular-nums text-slate-600">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">Eslatma</span>
                </div>
                <div className="flex items-center gap-2 pl-11 sm:pl-0">
                  <select
                    aria-label="Eslatma yuborish vaqti"
                    value={reminder.leadTimeMinutes}
                    onChange={(event) =>
                      patchRule(index, {
                        enabled: true,
                        leadTimeMinutes: Number(event.target.value),
                      })
                    }
                    className="min-w-40 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/10"
                  >
                    {PRESETS.map((preset) => (
                      <option
                        key={preset}
                        value={preset}
                        disabled={sms.appointmentReminders.some(
                          (rule, ruleIndex) =>
                            ruleIndex !== index && rule.leadTimeMinutes === preset,
                        )}
                      >
                        {leadTimeLabel(preset)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Eslatmani o‘chirish"
                    onClick={() =>
                      patchSms({
                        appointmentReminders: sms.appointmentReminders.filter(
                          (_, ruleIndex) => ruleIndex !== index,
                        ),
                      })
                    }
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-blue/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={17} />
          {save.isPending ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
        </button>
      </div>
    </div>
  );
}
