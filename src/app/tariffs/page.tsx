"use client";

/**
 * File: src/app/tariffs/page.tsx
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  UserRoundCog,
  HardDrive,
  MessageCircle,
  Users,
  Stethoscope,
  X,
} from "lucide-react";

import LandingHeader from "@/src/components/layout/LandingHeader";
import Footer from "@/src/components/layout/Footer";
import LeadModal from "@/src/components/shared/LeadModal";

const plans = [
  {
    name: "START",
    icon: Sparkles,
    tag: "Kichik klinika",
    monthlyPrice: 150000,
    desc: "Tizimni sinab ko'rish yoki bitta xonali yangi klinikalar uchun.",
    color: "from-sky-500 to-cyan-500",
    textColor: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    features: [
      { icon: Stethoscope, text: "2 ta shifokorgacha" },
      { icon: Users,        text: "2 ta xodimgacha" },
      { icon: HardDrive,    text: "10 GB saqlash" },
      { icon: MessageCircle,text: "SMS: alohida balans" },
      { icon: CheckCircle2, text: "Bemorlar bazasi" },
      { icon: CheckCircle2, text: "Qabul jadvali" },
      { icon: CheckCircle2, text: "Dental chart" },
    ],
    notIncluded: [
      "Bepul SMS paket",
      "Kengaytirilgan hisobotlar",
      "API integratsiya",
    ],
  },
  {
    name: "PRO",
    icon: UserRoundCog,
    tag: "Eng ideal tanlov",
    monthlyPrice: 350000,
    desc: "Bir nechta xonaga ega va bemorlar oqimi barqaror klinikalar uchun.",
    color: "from-violet-600 to-purple-600",
    textColor: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-300",
    featured: true,
    features: [
      { icon: Stethoscope,  text: "7 ta shifokorgacha" },
      { icon: Users,        text: "5 ta xodimgacha" },
      { icon: HardDrive,    text: "50 GB saqlash" },
      { icon: MessageCircle,text: "500 ta bepul SMS" },
      { icon: CheckCircle2, text: "Bemorlar bazasi" },
      { icon: CheckCircle2, text: "Qabul jadvali" },
      { icon: CheckCircle2, text: "Dental chart" },
      { icon: CheckCircle2, text: "Kengaytirilgan hisobotlar" },
    ],
    notIncluded: [
      "API integratsiya",
    ],
  },
  {
    name: "ENTERPRISE",
    icon: Building2,
    tag: "Katta tarmoq",
    monthlyPrice: 900000,
    desc: "Filialli yoki katta xodimlar tarkibiga ega markazlar uchun.",
    color: "from-rose-500 to-pink-600",
    textColor: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    features: [
      { icon: Stethoscope,  text: "Cheksiz shifokor" },
      { icon: Users,        text: "Cheksiz xodim" },
      { icon: HardDrive,    text: "1 TB saqlash" },
      { icon: MessageCircle,text: "5000 ta bepul SMS" },
      { icon: CheckCircle2, text: "Bemorlar bazasi" },
      { icon: CheckCircle2, text: "Qabul jadvali" },
      { icon: CheckCircle2, text: "Dental chart" },
      { icon: CheckCircle2, text: "Kengaytirilgan hisobotlar" },
      { icon: CheckCircle2, text: "API integratsiya" },
      { icon: CheckCircle2, text: "Maxsus qo'llab-quvvatlash" },
    ],
    notIncluded: [],
  },
];

const durations = [
  { months: 1,  label: "1 oy",    discount: 0 },
  { months: 3,  label: "3 oy",    discount: 5 },
  { months: 6,  label: "6 oy",    discount: 10 },
  { months: 12, label: "12 oy",   discount: 20 },
];

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(amount);
}

export default function TariffsPage() {
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const duration = durations.find((d) => d.months === selectedDuration)!;

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
              START kichik klinikalar uchun, PRO barqaror klinikalar uchun,
              ENTERPRISE yirik filialli markazlar uchun.
            </p>

            {/* Duration selector */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
              {durations.map((d) => (
                <button
                  key={d.months}
                  type="button"
                  onClick={() => setSelectedDuration(d.months)}
                  className={`relative rounded-xl px-4 py-2 text-sm font-bold transition ${
                    selectedDuration === d.months
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {d.label}
                  {d.discount > 0 && (
                    <span className="absolute -right-1 -top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                      -{d.discount}%
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
            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const price = calcPrice(plan.monthlyPrice);

                return (
                  <div
                    key={plan.name}
                    className={`relative flex flex-col rounded-3xl border-2 bg-white p-7 shadow-sm transition ${
                      plan.featured
                        ? `${plan.borderColor} shadow-xl shadow-violet-100`
                        : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1 text-xs font-black text-white shadow">
                          ⭐ Eng ko'p tanlanadi
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan.bgColor} ${plan.textColor}`}>
                        {plan.tag}
                      </span>
                    </div>

                    <h2 className="mt-5 text-2xl font-extrabold text-[#07105f]">
                      {plan.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{plan.desc}</p>

                    {/* Price */}
                    <div className="mt-5 flex items-end gap-1">
                      <span className={`text-4xl font-black ${plan.textColor}`}>
                        {formatPrice(price)}
                      </span>
                      <span className="mb-1 text-sm text-slate-400">
                        so'm / {duration.label}
                      </span>
                    </div>
                    {duration.discount > 0 && (
                      <p className="mt-1 text-xs text-emerald-600 font-semibold">
                        {duration.discount}% chegirma — {formatPrice(plan.monthlyPrice * selectedDuration)} o'rniga
                      </p>
                    )}

                    {/* CTA */}
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
                        plan.featured
                          ? `bg-gradient-to-r ${plan.color} text-white shadow-lg hover:opacity-90`
                          : "border-2 border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50"
                      }`}
                    >
                      Demo olish <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="my-6 border-t border-slate-100" />

                    {/* Features */}
                    <ul className="flex-1 space-y-2.5">
                      {plan.features.map((f, i) => {
                        const FIcon = f.icon;
                        return (
                          <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                            <FIcon className={`h-4 w-4 shrink-0 ${plan.textColor}`} />
                            {f.text}
                          </li>
                        );
                      })}
                      {plan.notIncluded.map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm text-slate-400">
                          <X className="h-4 w-4 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="mb-10 text-center text-2xl font-extrabold text-[#07105f] sm:text-3xl">
              Ko'p so'raladigan savollar
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
              ].map((faq, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="font-bold text-slate-900">{faq.q}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.a}</p>
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
                Mutaxassisimiz klinikangizga mos tarifni tanlashda yordam beradi.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#07105f] transition hover:scale-[1.02]"
              >
                Bepul konsultatsiya <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer onDemoClick={() => setModalOpen(true)} />

      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}