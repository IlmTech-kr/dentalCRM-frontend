"use client";

/**
 * Fully responsive — mobile first
 */

import Link from "next/link";
import { useTranslations } from "next-intl";
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
import { BRAND, LogoMark } from "@/src/components/shared/BrandLogo";
import Footer from "./_components/Footer";
import LeadModal from "./_components/LeadModal";
import MacbookFrameScene from "./_components/MacbookFrameScene";

const FEATURE_ICONS = [
  Users,
  CalendarCheck,
  Stethoscope,
  Activity,
  ClipboardList,
  Wallet,
  BarChart3,
  Building2,
];

const BENEFIT_ICONS = [Clock, ShieldCheck, LayoutGrid, MessageCircle];

const TARIFF_ICONS = [Sparkles, UserRoundCog, Building2];

const CHECKLIST_COLORS = ["text-sky-500", "text-violet-500", "text-rose-500", "text-cyan-500"];

export default function HomePage() {
  const t = useTranslations("marketing");

  const features = t.raw("features.items") as { title: string; desc: string }[];
  const steps = t.raw("howItWorks.steps") as { title: string; desc: string }[];
  const benefits = t.raw("about.benefits") as { title: string; desc: string }[];
  const stats = t.raw("about.stats") as { value: string; label: string }[];
  const tariffPlans = t.raw("tariffs.plans") as {
    name: string;
    tag: string;
    desc: string;
    items: string[];
  }[];
  const checklist = t.raw("hero.checklist") as string[];

  return (
    <div className="bg-white text-slate-900">
      <main>
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <MacbookFrameScene
          loaderLabel={t("hero.mockup.dashboardLabel")}
          panels={features.slice(0, 6).map((f) => ({ title: f.title, desc: f.desc }))}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/75 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur sm:px-4 sm:text-sm">
            <LogoMark small />
            {t("hero.badge")}
          </div>

          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#07105f] sm:text-4xl lg:text-[3.2rem]">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base lg:mx-0 lg:text-lg">
            {t("hero.description", { brand: BRAND })}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3 sm:mt-7 lg:justify-start">
            <Link
              href="/subdomains"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-100 transition-all hover:scale-[1.02] sm:px-7 sm:py-3.5 sm:text-base"
            >
              {t("hero.loginButton")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-violet-200 hover:bg-violet-50 sm:px-7 sm:py-3.5 sm:text-base"
            >
              {t("hero.registerButton")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 hidden grid-cols-2 gap-2 text-sm text-slate-600 sm:mt-8 sm:grid">
            {checklist.map((text, i) => (
              <div key={text} className="flex items-center justify-center gap-2 lg:justify-start">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${CHECKLIST_COLORS[i]}`} />
                <span className="text-xs sm:text-sm">{text}</span>
              </div>
            ))}
          </div>
        </MacbookFrameScene>

        {/* ── FEATURES ─────────────────────────────────────────────── */}
        <section id="features" className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">{t("features.eyebrow")}</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#07105f] sm:text-3xl lg:text-4xl">
                {t("features.title")}
              </h2>
              <p className="mt-4 text-sm text-slate-600 sm:text-base">
                {t("features.subtitle")}
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {features.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100 sm:rounded-3xl sm:p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-violet-100 sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 text-violet-700 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900 sm:mt-5 sm:text-lg">{f.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section id="how-it-works" className="bg-gradient-to-b from-white to-slate-50 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
              <div className="text-center lg:text-left">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">{t("howItWorks.eyebrow")}</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#07105f] sm:text-3xl lg:text-4xl">
                  {t("howItWorks.title")}
                </h2>
                <p className="mt-4 text-sm text-slate-600 sm:text-base">
                  {t("howItWorks.subtitle")}
                </p>
              </div>

              <div className="grid gap-4 sm:gap-5">
                {steps.map((step, i) => (
                  <div key={step.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
                    <div className="flex gap-4 sm:gap-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 text-xs font-extrabold text-white sm:h-12 sm:w-12 sm:text-sm">
                        {String(i + 1).padStart(2, "0")}
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
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">{t("about.eyebrow")}</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#07105f] sm:text-3xl lg:text-4xl">
                  {t("about.title")}
                </h2>
                <p className="mt-4 text-sm text-slate-600 sm:mt-5 sm:text-base">
                  {t("about.description", { brand: BRAND })}
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2 sm:mt-8">
                  {benefits.map((b, i) => {
                    const Icon = BENEFIT_ICONS[i];
                    return (
                      <div key={b.title} className="flex gap-3 text-left">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-violet-100 sm:h-11 sm:w-11">
                          <Icon className="h-4 w-4 text-violet-700 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{b.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{b.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 p-1 sm:rounded-[2rem]">
                <div className="rounded-[1.3rem] bg-white p-5 sm:rounded-[1.8rem] sm:p-8">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {stats.map((stat) => (
                      <div key={stat.label} className="rounded-2xl bg-slate-50 p-4 text-center sm:rounded-3xl sm:p-6">
                        <p className="text-2xl font-extrabold text-[#07105f] sm:text-3xl">{stat.value}</p>
                        <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#07105f] p-4 text-white sm:mt-6 sm:rounded-3xl sm:p-6">
                    <p className="text-base font-bold sm:text-lg">{t("about.cardTitle")}</p>
                    <p className="mt-1.5 text-xs text-sky-100/75 sm:mt-2 sm:text-sm">{t("about.cardSubtitle")}</p>
                    <Link href="/tariffs" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-200 sm:mt-5 sm:text-sm">
                      {t("about.cardLink")} <ArrowRight className="h-4 w-4" />
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
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">{t("tariffs.eyebrow")}</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#07105f] sm:text-3xl lg:text-4xl">
                {t("tariffs.title")}
              </h2>
              <p className="mt-4 text-sm text-slate-600 sm:text-base">
                {t("tariffs.subtitle")}
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {tariffPlans.map((plan, i) => {
                const Icon = TARIFF_ICONS[i];
                return (
                  <div
                    key={plan.name}
                    className={`rounded-[1.5rem] border bg-white p-6 shadow-sm sm:rounded-[2rem] sm:p-7 ${
                      plan.name === "PRO" ? "border-violet-200 shadow-xl shadow-violet-100" : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 sm:h-12 sm:w-12">
                        <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
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
                      {t("tariffs.viewButton")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section id="contact" className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-[#07105f] via-violet-800 to-rose-600 p-6 text-white shadow-2xl shadow-violet-100 sm:rounded-[2rem] sm:p-12">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-sky-100/80 sm:text-base">
                {t("cta.description")}
              </p>

              <div className="mt-7 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#07105f] transition-all hover:scale-[1.02] sm:w-auto sm:px-7 sm:py-3.5 sm:text-base"
                >
                  {t("cta.registerButton")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tariffs"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 sm:w-auto sm:px-7 sm:py-3.5 sm:text-base"
                >
                  {t("cta.tariffsButton")} <ArrowRight className="h-4 w-4" />
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
