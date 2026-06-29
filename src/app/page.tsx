/**
 * File: src/app/page.tsx
 * Fully responsive — mobile first
 */

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  LayoutGrid,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCog,
  Users,
  Wallet,
} from "lucide-react";
import LandingHeader from "../components/layout/LandingHeader";
import { BRAND, LogoMark } from "../components/shared/BrandLogo";
import Footer from "../components/layout/Footer";
import LeadModal from "../components/shared/LeadModal";


const features = [
  { icon: Users,        title: "Bemorlar bazasi",      desc: "Bemor ma'lumotlari, telefon raqami, anamnez, hujjatlar va rentgen suratlari bitta kartada." },
  { icon: CalendarCheck,title: "Qabul jadvali",         desc: "Qabullarni kun, hafta va shifokor kesimida boshqaring. Vaqt to'qnashuvlarini kamaytiring." },
  { icon: Stethoscope,  title: "Shifokorlar",           desc: "Shifokor, reception, assistent va adminlar uchun alohida rollar va kirish huquqlari." },
  { icon: Activity,     title: "Dental chart",          desc: "Tishlar bo'yicha tashxis, holat, plomba, implant, root canal va izohlarni belgilang." },
  { icon: ClipboardList,title: "Davolash kurslari",     desc: "Muolajalar rejasini bosqichma-bosqich yuriting, tashriflar va bajarilgan ishlarni nazorat qiling." },
  { icon: Wallet,       title: "To'lov va qarzdorlik",  desc: "Bemor to'lovlari, xizmat narxlari va qoldiq qarzdorlikni aniq hisobda ko'ring." },
  { icon: BarChart3,    title: "Hisobotlar",            desc: "Qabullar, daromad, xodimlar samaradorligi va bemorlar oqimi bo'yicha statistikani kuzating." },
  { icon: Building2,    title: "Multi-tenant tizim",    desc: "Har bir klinika yoki filial alohida subdomain va alohida ma'lumotlar muhiti bilan ishlaydi." },
];

const steps = [
  { number: "01", title: "Klinikani ro'yxatdan o'tkazing", desc: "Subdomain, klinika profili va asosiy sozlamalarni bir necha daqiqada tayyorlang." },
  { number: "02", title: "Jamoani qo'shing",               desc: "Shifokor, reception, assistent va adminlarga rol bo'yicha kirish huquqi bering." },
  { number: "03", title: "Bemorlarni qabulga yozing",       desc: "Telefon raqam orqali bemorni toping, yangi bemor oching va qabul vaqtini belgilang." },
  { number: "04", title: "Davolash va hisobotlarni kuzating", desc: "Dental chart, kurs, to'lovlar va klinika ko'rsatkichlarini real vaqtda boshqaring." },
];

const benefits = [
  { icon: Clock,        title: "Vaqtni tejaydi",               desc: "Qabul, hisobot va bemor qidirish jarayonlarini tezlashtiradi." },
  { icon: ShieldCheck,  title: "Ma'lumotni himoyalaydi",        desc: "Har bir xodim faqat o'z roliga mos bo'limlarni ko'radi." },
  { icon: LayoutGrid,   title: "Ishni tartiblaydi",             desc: "Klinikadagi asosiy jarayonlar bitta CRM oqimiga tushadi." },
  { icon: MessageCircle,title: "Bemor bilan aloqani kuchaytiradi", desc: "SMS eslatmalar orqali qabulga kelmaslik holati kamayadi." },
];

const tariffPreview = [
  {
    name: "START", icon: Sparkles, tag: "Kichik klinika",
    desc: "Tizimni sinab ko'rish yoki bitta xonali yangi klinikalar uchun.",
    items: ["2 ta shifokorgacha", "2 ta xodimgacha", "10 GB saqlash", "SMS: alohida balans"],
  },
  {
    name: "PRO", icon: UserRoundCog, tag: "Eng ideal tanlov",
    desc: "Bir nechta xonaga ega va bemorlar oqimi barqaror klinikalar uchun.",
    items: ["7 ta shifokorgacha", "5 ta xodimgacha", "50 GB saqlash", "500 ta bepul SMS"],
  },
  {
    name: "ENTERPRISE", icon: Building2, tag: "Katta tarmoq",
    desc: "Filialli yoki katta xodimlar tarkibiga ega markazlar uchun.",
    items: ["Cheksiz shifokor", "Cheksiz xodim", "1 TB saqlash", "5000 ta bepul SMS"],
  },
];

export default function HomePage() {
  return (
    <div className="bg-white text-slate-900">
      <LandingHeader />

      <main>
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#e0f7ff,transparent_38%),radial-gradient(circle_at_top_right,#f5d0fe,transparent_30%),linear-gradient(to_bottom,#ffffff,#f8fbff)]">
          <div className="absolute left-1/2 top-16 h-48 w-48 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-rose-200/40 blur-3xl sm:h-72 sm:w-72" />

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:py-24">
            {/* Left */}
            <div className="relative text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/75 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur sm:px-4 sm:text-sm">
                <LogoMark small />
                Stomatologiya klinikalari uchun CRM
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#07105f] sm:text-4xl lg:text-[3.2rem]">
                Dental klinikangizni bitta zamonaviy tizimda boshqaring
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 lg:mx-0 lg:text-lg">
                {BRAND} bemorlar bazasi, qabul jadvali, shifokorlar, dental
                chart, davolash kurslari, to'lovlar va SMS eslatmalarni bitta
                platformaga birlashtiradi.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-100 transition-all hover:scale-[1.02] sm:px-7 sm:py-3.5 sm:text-base"
                >
                  Demo olish <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-violet-200 hover:bg-violet-50 sm:px-7 sm:py-3.5 sm:text-base"
                >
                  Ro'yxatdan o'tish <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2 text-sm text-slate-600">
                {[
                  ["text-sky-500",    "O'rnatish 1 kun ichida"],
                  ["text-violet-500", "Multi-tenant SaaS"],
                  ["text-rose-500",   "Role-based access"],
                  ["text-cyan-500",   "SMS eslatmalar"],
                ].map(([color, text]) => (
                  <div key={text} className="flex items-center justify-center gap-2 lg:justify-start">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${color}`} />
                    <span className="text-xs sm:text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — MacBook mockup */}
            <div className="relative mx-auto w-full max-w-[480px] lg:max-w-[560px]">
              <div className="relative">
                {/* Screen bezel */}
                <div className="overflow-hidden rounded-t-[14px] rounded-b-[5px] border-[6px] border-[#1a1a1a] bg-[#1a1a1a] shadow-2xl shadow-slate-900/40 sm:border-[8px] sm:rounded-t-[18px] sm:rounded-b-[6px]">
                  <div className="absolute left-1/2 top-0.5 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#333]" />

                  <div className="overflow-hidden rounded-[4px] bg-white sm:rounded-[6px]">
                    {/* Browser bar */}
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f5f5f7] px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
                      <div className="flex gap-1 sm:gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#ff5f57] sm:h-2.5 sm:w-2.5" />
                        <div className="h-2 w-2 rounded-full bg-[#febc2e] sm:h-2.5 sm:w-2.5" />
                        <div className="h-2 w-2 rounded-full bg-[#28c840] sm:h-2.5 sm:w-2.5" />
                      </div>
                      <div className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-2 py-1 text-[9px] text-slate-400 shadow-sm sm:text-[10px]">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        clinic1.dentalcrm.uz/dashboard
                      </div>
                      <div className="w-10 sm:w-14" />
                    </div>

                    {/* App UI */}
                    <div className="flex h-[260px] sm:h-[320px] lg:h-[340px]">
                      {/* Sidebar */}
                      <div className="flex w-9 flex-col items-center gap-2.5 bg-[#3498db] py-3 sm:w-12 sm:gap-3 sm:py-4">
                        <div className="h-6 w-6 rounded-lg bg-white/25 sm:h-7 sm:w-7" />
                        <div className="mt-1 flex flex-col gap-2">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className={`h-5 w-5 rounded-md sm:h-6 sm:w-6 ${i === 0 ? "bg-white/30" : "bg-white/10"}`} />
                          ))}
                        </div>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 overflow-hidden bg-[#eef3ff] p-2 sm:p-3">
                        {/* Top bar */}
                        <div className="mb-2 flex items-center justify-between sm:mb-3">
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 sm:text-[9px]">Dashboard</p>
                            <p className="text-[10px] font-black text-slate-800 sm:text-[11px]">Xush kelibsiz 👋</p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <div className="h-4 w-12 rounded-lg bg-white shadow-sm sm:h-5 sm:w-16" />
                            <div className="h-4 w-4 rounded-lg bg-white shadow-sm sm:h-5 sm:w-5" />
                            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 sm:h-5 sm:w-5" />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="mb-2 grid grid-cols-3 gap-1.5 sm:mb-3 sm:gap-2">
                          {[
                            { label: "Bemorlar", value: "1,248", color: "text-blue-600",    bg: "bg-blue-50" },
                            { label: "Bugungi",  value: "24",    color: "text-violet-600",  bg: "bg-violet-50" },
                            { label: "Daromad",  value: "4.2M",  color: "text-emerald-600", bg: "bg-emerald-50" },
                          ].map((s) => (
                            <div key={s.label} className="rounded-xl bg-white p-2 shadow-sm sm:p-2.5">
                              <span className={`inline-block rounded-md px-1 py-0.5 text-[7px] font-black sm:text-[8px] ${s.bg} ${s.color}`}>{s.label}</span>
                              <p className={`mt-0.5 text-sm font-black leading-none sm:text-base ${s.color}`}>{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Appointments */}
                        <div className="rounded-xl bg-white p-2 shadow-sm sm:p-2.5">
                          <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                            <p className="text-[9px] font-black text-slate-700 sm:text-[10px]">Bugungi qabullar</p>
                            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] font-black text-emerald-600 sm:text-[8px]">+18%</span>
                          </div>
                          <div className="space-y-1 sm:space-y-1.5">
                            {[
                              { time: "09:00", name: "Aziza Karimova",  doc: "Dr. Akmal",  dot: "bg-emerald-500" },
                              { time: "10:30", name: "Javlon Tursunov", doc: "Dr. Madina", dot: "bg-amber-400" },
                              { time: "12:00", name: "Dilnoza Aliyeva", doc: "Dr. Akmal",  dot: "bg-blue-500" },
                            ].map((a) => (
                              <div key={a.name} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-1.5 py-1 sm:gap-2 sm:px-2 sm:py-1.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-violet-600 text-[7px] font-black text-white sm:h-8 sm:w-8 sm:text-[8px]">
                                  {a.time}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[9px] font-black text-slate-800 sm:text-[10px]">{a.name}</p>
                                  <p className="text-[8px] text-slate-400 sm:text-[9px]">{a.doc}</p>
                                </div>
                                <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${a.dot}`} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dental chart strip */}
                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-2 py-1.5 shadow-sm sm:px-3 sm:py-2">
                          <p className="shrink-0 text-[8px] font-black text-slate-400 sm:text-[9px]">Dental chart</p>
                          <div className="flex flex-1 gap-0.5 overflow-hidden sm:gap-1">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div key={i} className="h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3"
                                style={{
                                  background: i % 7 === 0 ? "#ef4444" : i % 5 === 0 ? "#f59e0b" : "linear-gradient(135deg,#bae6fd,#c4b5fd)"
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification */}
                <div className="absolute -right-3 top-10 hidden rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-xl shadow-violet-100 sm:-right-6 sm:top-12 sm:rounded-2xl sm:px-3 sm:py-2.5 lg:block">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800">Yangi bemor</p>
                      <p className="text-[9px] text-slate-400">Hozir qo'shildi</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MacBook base */}
              <div className="relative">
                <div className="mx-auto h-[3px] w-full rounded-b-sm bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] sm:h-[4px]" />
                <div className="mx-auto h-[16px] w-[108%] -translate-x-[3.7%] rounded-b-[10px] bg-gradient-to-b from-[#d0d0d0] to-[#b8b8b8] shadow-lg sm:h-[22px] sm:rounded-b-[12px]">
                  <div className="mx-auto mt-1.5 h-2.5 w-16 rounded-md bg-[#c4c4c4] sm:mt-2 sm:h-3 sm:w-24" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────── */}
        <section id="features" className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">Imkoniyatlar</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#07105f] sm:text-3xl lg:text-4xl">
                Klinikadagi asosiy jarayonlar bitta CRM ichida
              </h2>
              <p className="mt-4 text-sm text-slate-600 sm:text-base">
                Administrator, shifokor va klinika rahbari bir tizimda ishlaydi.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100 sm:rounded-3xl sm:p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-violet-100 sm:h-12 sm:w-12">
                    <f.icon className="h-5 w-5 text-violet-700 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 sm:mt-5 sm:text-lg">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section id="how-it-works" className="bg-gradient-to-b from-white to-slate-50 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
              <div className="text-center lg:text-left">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">Qanday ishlaydi</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#07105f] sm:text-3xl lg:text-4xl">
                  Klinikani CRM'ga ulash oson
                </h2>
                <p className="mt-4 text-sm text-slate-600 sm:text-base">
                  Tizimni ishga tushirish, xodimlarni qo'shish va birinchi bemorni qabulga yozish juda sodda.
                </p>
              </div>

              <div className="grid gap-4 sm:gap-5">
                {steps.map((step) => (
                  <div key={step.number} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
                    <div className="flex gap-4 sm:gap-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 text-xs font-extrabold text-white sm:h-12 sm:w-12 sm:text-sm">
                        {step.number}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 sm:text-lg">{step.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT ────────────────────────────────────────────────── */}
        <section id="about" className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="text-center lg:text-left">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">Nima uchun Dental CRM?</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#07105f] sm:text-3xl lg:text-4xl">
                  Klinikangizni tartibli, tezkor va nazorat qilinadigan tizimga o'tkazing
                </h2>
                <p className="mt-4 text-sm text-slate-600 sm:mt-5 sm:text-base">
                  {BRAND} klinika ichidagi qabul, bemor kartasi, shifokor jadvali, davolash kursi va hisobotlarni bir joyda birlashtiradi.
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2 sm:mt-8">
                  {benefits.map((b) => (
                    <div key={b.title} className="flex gap-3 text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-violet-100 sm:h-11 sm:w-11">
                        <b.icon className="h-4 w-4 text-violet-700 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{b.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 p-1 sm:rounded-[2rem]">
                <div className="rounded-[1.3rem] bg-white p-5 sm:rounded-[1.8rem] sm:p-8">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {[
                      ["32",   "Dental chart tish raqamlari"],
                      ["24/7", "Online CRM access"],
                      ["SMS",  "Avtomatik eslatmalar"],
                      ["Role", "Xodimlarga alohida huquq"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl bg-slate-50 p-4 text-center sm:rounded-3xl sm:p-6">
                        <p className="text-2xl font-extrabold text-[#07105f] sm:text-3xl">{value}</p>
                        <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#07105f] p-4 text-white sm:mt-6 sm:rounded-3xl sm:p-6">
                    <p className="text-base font-bold sm:text-lg">START, PRO va ENTERPRISE tariflar</p>
                    <p className="mt-1.5 text-xs text-sky-100/75 sm:mt-2 sm:text-sm">Kichik klinikadan yirik tibbiy markazgacha mos yechim.</p>
                    <Link href="/tariffs" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-200 sm:mt-5 sm:text-sm">
                      Tariflarni ko'rish <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TARIFFS PREVIEW ──────────────────────────────────────── */}
        <section id="tariffs" className="bg-slate-50 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">Tariflar</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#07105f] sm:text-3xl lg:text-4xl">
                Klinikangiz hajmiga mos tarifni tanlang
              </h2>
              <p className="mt-4 text-sm text-slate-600 sm:text-base">
                START kichik klinikalar uchun, PRO barqaror ishlayotgan klinikalar uchun, ENTERPRISE esa yirik filialli markazlar uchun.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {tariffPreview.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-[1.5rem] border bg-white p-6 shadow-sm sm:rounded-[2rem] sm:p-7 ${
                    plan.name === "PRO" ? "border-violet-200 shadow-xl shadow-violet-100" : "border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 sm:h-12 sm:w-12">
                      <plan.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                    </div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{plan.tag}</span>
                  </div>

                  <h3 className="mt-5 text-xl font-extrabold text-[#07105f] sm:mt-6 sm:text-2xl">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{plan.desc}</p>

                  <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-600" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/tariffs"
                    className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                      plan.name === "PRO"
                        ? "bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 text-white shadow-lg shadow-violet-100"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50"
                    }`}
                  >
                    Batafsil ko'rish <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section id="contact" className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-[#07105f] via-violet-800 to-rose-600 p-6 text-white shadow-2xl shadow-violet-100 sm:rounded-[2rem] sm:p-12">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                CRM'ni klinikangizda sinab ko'ring
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-sky-100/80 sm:text-base">
                Demo so'rovi qoldiring. Klinikangiz hajmi, shifokorlar soni va
                jarayonlaringizga qarab eng mos yechimni tavsiya qilamiz.
              </p>

              <div className="mt-7 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#07105f] transition-all hover:scale-[1.02] sm:w-auto sm:px-7 sm:py-3.5 sm:text-base"
                >
                  Ro'yxatdan o'tish <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tariffs"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 sm:w-auto sm:px-7 sm:py-3.5 sm:text-base"
                >
                  Tariflarni ko'rish <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LeadModal />
    </div>
  );
}