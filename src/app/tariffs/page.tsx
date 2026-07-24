"use client";

/**
 * File: src/app/tariffs/page.tsx
 */

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  HardDrive,
  Loader2,
  MessageCircle,
  Sparkles,
  Stethoscope,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";

import LandingHeader from "@/src/components/layout/LandingHeader";
import Footer from "@/src/components/layout/Footer";
import LeadModal from "@/src/components/shared/LeadModal";

import { usePlans } from "@/src/features/superadmin/subscriptions/UseSupscriptionAdmin";

type PlanUiConfig = {
  icon: LucideIcon;
  tag: string;
  desc: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  featured?: boolean;
  extraFeatures: string[];
  notIncluded: string[];
};

const PLAN_UI: Record<string, PlanUiConfig> = {
  START: {
    icon: Sparkles,
    tag: "Kichik klinika",
    desc: "Tizimni sinab ko'rish yoki bitta xonali yangi klinikalar uchun.",
    color: "from-sky-500 to-cyan-500",
    textColor: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    extraFeatures: [
      "Bemorlar bazasi",
      "Qabul jadvali",
      "Dental chart",
    ],
    notIncluded: [
      "Kengaytirilgan hisobotlar",
      "API integratsiya",
    ],
  },

  PRO: {
    icon: UserRoundCog,
    tag: "Eng ideal tanlov",
    desc: "Bir nechta xonaga ega va bemorlar oqimi barqaror klinikalar uchun.",
    color: "from-violet-600 to-purple-600",
    textColor: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-300",
    featured: true,
    extraFeatures: [
      "Bemorlar bazasi",
      "Qabul jadvali",
      "Dental chart",
      "Kengaytirilgan hisobotlar",
    ],
    notIncluded: ["API integratsiya"],
  },

  ENTERPRISE: {
    icon: Building2,
    tag: "Katta tarmoq",
    desc: "Filialli yoki katta xodimlar tarkibiga ega markazlar uchun.",
    color: "from-rose-500 to-pink-600",
    textColor: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    extraFeatures: [
      "Bemorlar bazasi",
      "Qabul jadvali",
      "Dental chart",
      "Kengaytirilgan hisobotlar",
      "API integratsiya",
      "Maxsus qo'llab-quvvatlash",
    ],
    notIncluded: [],
  },
};

const DEFAULT_PLAN_UI: PlanUiConfig = {
  icon: Sparkles,
  tag: "Tarif",
  desc: "Klinikangiz uchun mos imkoniyatlar to'plami.",
  color: "from-slate-600 to-slate-800",
  textColor: "text-slate-700",
  bgColor: "bg-slate-100",
  borderColor: "border-slate-200",
  extraFeatures: [
    "Bemorlar bazasi",
    "Qabul jadvali",
    "Dental chart",
  ],
  notIncluded: [],
};

const PLAN_ORDER: Record<string, number> = {
  START: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

const durations = [
  {
    months: 1,
    label: "1 oy",
    discount: 0,
  },
  {
    months: 3,
    label: "3 oy",
    discount: 5,
  },
  {
    months: 6,
    label: "6 oy",
    discount: 10,
  },
  {
    months: 12,
    label: "12 oy",
    discount: 20,
  },
];

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(amount);
}

function formatStorage(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 GB";
  }

  const gigabytes = bytes / 1024 ** 3;

  if (gigabytes >= 1024) {
    const terabytes = gigabytes / 1024;

    return `${
      Number.isInteger(terabytes)
        ? terabytes
        : terabytes.toFixed(1)
    } TB`;
  }

  return `${
    Number.isInteger(gigabytes)
      ? gigabytes
      : gigabytes.toFixed(1)
  } GB`;
}

function formatLimit(
  value: number,
  resourceName: string,
  planType: string
): string {
  const normalizedPlanType = planType.toUpperCase();

  if (
    normalizedPlanType === "ENTERPRISE" ||
    value <= 0 ||
    value >= 2147483647
  ) {
    return `Cheksiz ${resourceName}`;
  }

  return `${value} ta ${resourceName}gacha`;
}

function formatSmsCount(count: number): string {
  if (count <= 0) {
    return "SMS: alohida balans";
  }

  return `${formatPrice(count)} ta bepul SMS`;
}

export default function TariffsPage() {
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: backendPlans = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = usePlans();

  const duration =
    durations.find(
      (item) => item.months === selectedDuration
    ) ?? durations[0];

  const plans = [...backendPlans]
    .filter((plan) => plan.active)
    .sort((firstPlan, secondPlan) => {
      const firstCode = firstPlan.planType.toUpperCase();
      const secondCode = secondPlan.planType.toUpperCase();

      return (
        (PLAN_ORDER[firstCode] ?? 999) -
        (PLAN_ORDER[secondCode] ?? 999)
      );
    });

  function calcPrice(monthlyPrice: number): number {
    const total = monthlyPrice * selectedDuration;
    const discount = total * (duration.discount / 100);

    return Math.round(total - discount);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingHeader onDemoClick={() => setModalOpen(true)} />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
              Tariflar
            </p>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#07105f] sm:text-4xl lg:text-5xl">
              Klinikangiz hajmiga mos tarifni tanlang
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Klinikangiz hajmi va xodimlar soniga mos tarifni
              tanlang.
            </p>

            {/* Duration selector */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
              {durations.map((item) => (
                <button
                  key={item.months}
                  type="button"
                  onClick={() => setSelectedDuration(item.months)}
                  className={`relative rounded-xl px-4 py-2 text-sm font-bold transition ${
                    selectedDuration === item.months
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}

                  {item.discount > 0 && (
                    <span className="absolute -right-1 -top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                      -{item.discount}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-20 pt-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {isLoading && (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-9 w-9 animate-spin text-violet-600" />

                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    Tariflar yuklanmoqda...
                  </p>
                </div>
              </div>
            )}

            {!isLoading && isError && (
              <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

                <h2 className="mt-4 text-lg font-extrabold text-red-900">
                  Tariflarni yuklab bo&apos;lmadi
                </h2>

                <p className="mt-2 text-sm text-red-700">
                  Backend bilan bog&apos;lanishda xatolik yuz berdi.
                </p>

                <button
                  type="button"
                  disabled={isFetching}
                  onClick={() => refetch()}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isFetching && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Qayta urinish
                </button>
              </div>
            )}

            {!isLoading && !isError && plans.length === 0 && (
              <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-slate-400" />

                <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                  Faol tariflar topilmadi
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Hozircha foydalanish uchun faol tarif mavjud emas.
                </p>
              </div>
            )}

            {!isLoading && !isError && plans.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => {
                  const planCode = plan.planType.toUpperCase();

                  const ui =
                    PLAN_UI[planCode] ?? DEFAULT_PLAN_UI;

                  const Icon = ui.icon;
                  const price = calcPrice(plan.monthlyPrice);

                  const originalPrice =
                    plan.monthlyPrice * selectedDuration;

                  const dynamicFeatures = [
                    {
                      icon: Stethoscope,
                      text: formatLimit(
                        plan.maxDoctors,
                        "shifokor",
                        planCode
                      ),
                    },
                    {
                      icon: Users,
                      text: formatLimit(
                        plan.maxStaff,
                        "xodim",
                        planCode
                      ),
                    },
                    {
                      icon: HardDrive,
                      text: `${formatStorage(
                        plan.storageLimitBytes
                      )} saqlash`,
                    },
                    {
                      icon: MessageCircle,
                      text: formatSmsCount(plan.includedSmsCount),
                    },
                  ];

                  return (
                    <div
                      key={plan.planType}
                      className={`relative flex flex-col rounded-3xl border-2 bg-white p-7 shadow-sm transition ${
                        ui.featured
                          ? `${ui.borderColor} shadow-xl shadow-violet-100`
                          : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                      }`}
                    >
                      {ui.featured && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1 text-xs font-black text-white shadow">
                            ⭐ Eng ko&apos;p tanlanadi
                          </span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${ui.color}`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${ui.bgColor} ${ui.textColor}`}
                        >
                          {ui.tag}
                        </span>
                      </div>

                      <h2 className="mt-5 text-2xl font-extrabold text-[#07105f]">
                        {planCode}
                      </h2>

                      <p className="mt-1 min-h-[40px] text-sm text-slate-500">
                        {ui.desc}
                      </p>

                      {/* Price */}
                      <div className="mt-5 flex flex-wrap items-end gap-1">
                        <span
                          className={`text-4xl font-black ${ui.textColor}`}
                        >
                          {formatPrice(price)}
                        </span>

                        <span className="mb-1 text-sm text-slate-400">
                          so&apos;m / {duration.label}
                        </span>
                      </div>

                      {duration.discount > 0 && (
                        <p className="mt-1 text-xs font-semibold text-emerald-600">
                          {duration.discount}% chegirma —{" "}
                          {formatPrice(originalPrice)} o&apos;rniga
                        </p>
                      )}

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
                          ui.featured
                            ? `bg-gradient-to-r ${ui.color} text-white shadow-lg hover:opacity-90`
                            : "border-2 border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50"
                        }`}
                      >
                        Demo olish
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <div className="my-6 border-t border-slate-100" />

                      {/* Features */}
                      <ul className="flex-1 space-y-2.5">
                        {dynamicFeatures.map((feature, index) => {
                          const FeatureIcon = feature.icon;

                          return (
                            <li
                              key={`dynamic-${index}`}
                              className="flex items-center gap-2.5 text-sm text-slate-700"
                            >
                              <FeatureIcon
                                className={`h-4 w-4 shrink-0 ${ui.textColor}`}
                              />

                              {feature.text}
                            </li>
                          );
                        })}

                        {ui.extraFeatures.map((feature, index) => (
                          <li
                            key={`extra-${index}`}
                            className="flex items-center gap-2.5 text-sm text-slate-700"
                          >
                            <CheckCircle2
                              className={`h-4 w-4 shrink-0 ${ui.textColor}`}
                            />

                            {feature}
                          </li>
                        ))}

                        {ui.notIncluded.map((feature, index) => (
                          <li
                            key={`excluded-${index}`}
                            className="flex items-center gap-2.5 text-sm text-slate-400"
                          >
                            <X className="h-4 w-4 shrink-0" />

                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="mb-10 text-center text-2xl font-extrabold text-[#07105f] sm:text-3xl">
              Ko&apos;p so&apos;raladigan savollar
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: "Sinov muddati bormi?",
                  a: "Ha, ro'yxatdan o'tgandan so'ng 14 kunlik bepul sinov muddati beriladi. Kredit karta talab qilinmaydi.",
                },
                {
                  q: "To'lovni qanday amalga oshiraman?",
                  a: "Payme orqali to'lash mumkin. To'lov muvaffaqiyatli bo'lgandan so'ng tarif darhol faollashadi.",
                },
                {
                  q: "Tarifni o'zgartirish mumkinmi?",
                  a: "Ha, istalgan vaqtda yuqori tarifga o'tish mumkin. Farq hisoblab chiqiladi.",
                },
                {
                  q: "Ma'lumotlarim xavfsizmi?",
                  a: "Har bir klinika alohida subdomain va alohida ma'lumotlar muhitida ishlaydi. Sizning ma'lumotlaringizga boshqalar kira olmaydi.",
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <p className="font-bold text-slate-900">
                    {faq.q}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <div className="rounded-3xl bg-gradient-to-br from-[#07105f] via-violet-800 to-rose-600 p-8 text-white sm:p-12">
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                Hali ham savollaringiz bormi?
              </h2>

              <p className="mt-3 text-sky-100/80">
                Mutaxassisimiz klinikangizga mos tarifni tanlashda
                yordam beradi.
              </p>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#07105f] transition hover:scale-[1.02]"
              >
                Bepul konsultatsiya
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer onDemoClick={() => setModalOpen(true)} />

      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}