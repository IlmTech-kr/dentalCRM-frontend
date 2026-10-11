"use client";

/**
 * Fully responsive — mobile first
 */

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  Clock,
  LayoutGrid,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { BRAND } from "@/src/components/shared/BrandLogo";
import ConnectedSteps from "./_components/ConnectedSteps";
import FeatureArt, { WIDE_FEATURES } from "./_components/FeatureArt";
import FilmHero from "./_components/FilmHero";
import Footer from "./_components/Footer";
import LeadModal from "./_components/LeadModal";
import PlanArt from "./_components/PlanArt";

const BENEFIT_ICONS = [Clock, ShieldCheck, LayoutGrid, MessageCircle];

/* ── Shared styles ─────────────────────────────────────────── */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500";

const BTN =
  `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition sm:px-7 sm:py-3.5 sm:text-base ${FOCUS}`;

/* The sky→violet→rose spectrum is the logo's; it marks the one primary action. */
const BTN_PRIMARY = `${BTN} bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 text-white hover:brightness-110`;
const BTN_ON_FILM = `${BTN} border border-white/35 text-white hover:bg-white/10`;
const BTN_OUTLINE = `${BTN} border border-[#07105f]/20 text-[#07105f] hover:border-[#07105f]/45 hover:bg-white`;

const SECTION = "py-16 sm:py-24";
const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const SECTION_NAME = "text-sm font-medium text-violet-700";
const H2 =
  "mt-3 text-balance text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-[#07105f]";
const LEAD = "text-base leading-relaxed text-slate-600 sm:text-lg";

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
  const filmCaptions = t.raw("hero.film.captions") as string[];

  return (
    <div className="bg-white text-slate-900">
      <main>
        {/* ── HERO: the film, full screen ──────────────────────────── */}
        <FilmHero
          captions={filmCaptions}
          skipLabel={t("hero.film.skip")}
          end={
            <div className="max-w-2xl">
              <p className="text-balance text-[clamp(1.5rem,3.6vw,3rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#07105f]">
                {t("hero.film.endTitle")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/register" className={BTN_PRIMARY}>
                  {t("hero.registerButton")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/tariffs" className={BTN_OUTLINE}>
                  {t("cta.tariffsButton")}
                </Link>
              </div>
            </div>
          }
        >
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-white/80 sm:text-base">
                {t("hero.badge")}
              </p>
              <h1 className="mt-3 text-balance text-[clamp(2rem,5.4vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-white">
                {t("hero.title")}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:mt-5 sm:text-lg">
                {t("hero.description", { brand: BRAND })}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
                <Link href="/register" className={BTN_PRIMARY}>
                  {t("hero.registerButton")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/subdomains" className={BTN_ON_FILM}>
                  {t("hero.loginButton")}
                </Link>
              </div>
            </div>

            <ul className="hidden space-y-2.5 pb-1 text-sm text-white/85 lg:block">
              {checklist.map((text) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-sky-300" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </FilmHero>

        {/* ── FEATURES ─────────────────────────────────────────────── */}
        {/* Opens on the tone of the film's closing card, so the cut is soft. */}
        <section
          id="features"
          className={`scroll-mt-16 bg-[#eef1f6] bg-[linear-gradient(to_bottom,#c3cdd9_0,#eef1f6_16rem)] ${SECTION}`}
        >
          <div className={CONTAINER}>
            <div className="grid gap-5 lg:grid-cols-2 lg:items-end lg:gap-16">
              <div>
                <p className={SECTION_NAME}>{t("features.eyebrow")}</p>
                <h2 className={H2}>{t("features.title")}</h2>
              </div>
              <p className={`${LEAD} lg:pb-1`}>{t("features.subtitle")}</p>
            </div>

            <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className={`rounded-3xl bg-white p-3 ${
                    WIDE_FEATURES.has(i) ? "lg:col-span-2" : ""
                  }`}
                >
                  <FeatureArt index={i} />
                  <div className="px-3 pb-3 pt-5 sm:px-4">
                    <h3 className="text-lg font-semibold tracking-[-0.01em] text-[#07105f]">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-600">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section id="how-it-works" className={`scroll-mt-16 bg-white ${SECTION}`}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={SECTION_NAME}>{t("howItWorks.eyebrow")}</p>
              <h2 className={H2}>{t("howItWorks.title")}</h2>
              <p className={`mt-4 ${LEAD}`}>{t("howItWorks.subtitle")}</p>
            </div>

            <div className="mt-10 sm:mt-14">
              <ConnectedSteps steps={steps} />
            </div>
          </div>
        </section>

        {/* ── ABOUT ────────────────────────────────────────────────── */}
        <section id="about" className={`scroll-mt-16 bg-[#07105f] text-white ${SECTION}`}>
          <div className={CONTAINER}>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div>
                <p className="text-sm font-medium text-sky-300">{t("about.eyebrow")}</p>
                <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.025em]">
                  {t("about.title")}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                  {t("about.description", { brand: BRAND })}
                </p>

                <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                  {benefits.map((b, i) => {
                    const Icon = BENEFIT_ICONS[i];
                    return (
                      <div key={b.title} className="flex gap-3.5">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" strokeWidth={1.6} />
                        <div>
                          <p className="font-semibold">{b.title}</p>
                          <p className="mt-1 text-sm leading-6 text-white/65">{b.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:pt-2">
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/15 ring-1 ring-white/15">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col-reverse bg-[#07105f] p-5 sm:p-7">
                      <dt className="mt-2 text-xs leading-5 text-white/65 sm:text-sm">{stat.label}</dt>
                      <dd className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{stat.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <div>
                    <p className="font-semibold">{t("about.cardTitle")}</p>
                    <p className="mt-1 text-sm text-white/65">{t("about.cardSubtitle")}</p>
                  </div>
                  <Link
                    href="/tariffs"
                    className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-sky-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
                  >
                    {t("about.cardLink")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TARIFFS PREVIEW ──────────────────────────────────────── */}
        <section id="tariffs" className={`scroll-mt-16 bg-[#eef1f6] ${SECTION}`}>
          <div className={CONTAINER}>
            <div className="grid gap-5 lg:grid-cols-2 lg:items-end lg:gap-16">
              <div>
                <p className={SECTION_NAME}>{t("tariffs.eyebrow")}</p>
                <h2 className={H2}>{t("tariffs.title")}</h2>
              </div>
              <p className={`${LEAD} lg:pb-1`}>{t("tariffs.subtitle")}</p>
            </div>

            <div className="mt-10 grid gap-5 sm:mt-14 lg:grid-cols-3 lg:items-stretch">
              {tariffPlans.map((plan, i) => {
                const featured = plan.name === "PRO";
                return (
                  <div
                    key={plan.name}
                    className={`flex flex-col rounded-3xl p-3 ${
                      featured
                        ? "bg-[#07105f] text-white lg:-my-4"
                        : "bg-white text-[#07105f]"
                    }`}
                  >
                    <PlanArt index={i} featured={featured} />

                    <div className={`flex flex-1 flex-col px-4 pb-4 pt-6 sm:px-5 ${featured ? "lg:pt-8" : ""}`}>
                      <span
                        className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${
                          featured
                            ? "bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 text-white"
                            : "bg-[#eef1f6] text-violet-700"
                        }`}
                      >
                        {plan.tag}
                      </span>
                      <h3 className="mt-4 text-[2rem] font-semibold leading-none tracking-[-0.03em]">
                        {plan.name}
                      </h3>
                      <p className={`mt-3 text-sm leading-6 ${featured ? "text-white/70" : "text-slate-600"}`}>
                        {plan.desc}
                      </p>

                      <ul
                        className={`mt-6 divide-y border-y text-sm ${
                          featured
                            ? "divide-white/12 border-white/12 text-white/90"
                            : "divide-[#07105f]/10 border-[#07105f]/10 text-slate-700"
                        }`}
                      >
                        {plan.items.map((item) => (
                          <li key={item} className="flex items-center gap-3 py-3">
                            <Check className={`h-4 w-4 shrink-0 ${featured ? "text-sky-300" : "text-violet-700"}`} />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-7">
                        <Link
                          href="/tariffs"
                          className={`w-full ${featured ? BTN_PRIMARY : BTN_OUTLINE}`}
                        >
                          {t("tariffs.viewButton")}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className={`bg-white ${SECTION}`}>
          <div className={`${CONTAINER} grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16`}>
            <div>
              <h2 className="text-balance text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[#07105f]">
                {t("cta.title")}
              </h2>
              <p className={`mt-5 max-w-xl ${LEAD}`}>{t("cta.description")}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end lg:pb-1">
              <Link href="/register" className={BTN_PRIMARY}>
                {t("cta.registerButton")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tariffs" className={BTN_OUTLINE}>
                {t("cta.tariffsButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LeadModal />
    </div>
  );
}
