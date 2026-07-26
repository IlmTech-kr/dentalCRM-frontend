"use client";

/**
 * File: src/components/layout/LandingHeader.tsx
 */

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/src/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/src/components/shared/LanguageSwitcher";

export default function LandingHeader() {
  const t = useTranslations("layout");

  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { label: t("landingHeader.navFeatures"), href: "/#features" },
    { label: t("landingHeader.navHowItWorks"), href: "/#how-it-works" },
    { label: t("landingHeader.navPricing"), href: "/tariffs" },
    { label: t("landingHeader.navContact"), href: "/#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-violet-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher variant="compact" />
          <Link
            href="/register"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
          >
            {t("landingHeader.register")}
          </Link>
          <Link
            href="/subdomains"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {t("landingHeader.login")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-center">
            <LanguageSwitcher />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/register"
              className="rounded-2xl border border-slate-200 py-3 text-center text-sm font-bold text-slate-700"
            >
              {t("landingHeader.register")}
            </Link>
            <Link
              href="/subdomains"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 py-3 text-center text-sm font-bold text-white"
            >
              {t("landingHeader.login")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}