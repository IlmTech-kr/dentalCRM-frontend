"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/src/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/src/components/shared/LanguageSwitcher";

/* Scroll progress through the film hero at which it turns light
 * (see CHAPTER_STARTS / FILM_END in FilmHero). */
const FILM_DARK_UNTIL = 0.84;

export default function LandingHeader() {
  const t = useTranslations("layout");

  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  /* On the home page the header floats over the full-screen film until
   * the film cuts to its light closing card; everywhere else it is the
   * solid bar. */
  const [filmBehind, setFilmBehind] = useState(pathname === "/");

  useEffect(() => {
    const update = () => {
      const film = document.getElementById("film");
      if (!film) return setFilmBehind(false);

      const rect = film.getBoundingClientRect();
      const scrollDistance = film.offsetHeight - window.innerHeight;
      const progress = scrollDistance > 0 ? -rect.top / scrollDistance : 1;
      setFilmBehind(progress < FILM_DARK_UNTIL);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  const overFilm = filmBehind && !menuOpen;

  const NAV_LINKS = [
    { label: t("landingHeader.navFeatures"), href: "/#features" },
    { label: t("landingHeader.navHowItWorks"), href: "/#how-it-works" },
    { label: t("landingHeader.navPricing"), href: "/tariffs" },
    { label: t("landingHeader.navContact"), href: "/#contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${
        overFilm
          ? "border-white/10 bg-[#05070f]/35"
          : "border-slate-200/70 bg-white/90"
      }`}
    >
      {/* h-16 is load-bearing: the film hero pulls itself up by the same amount. */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo dark={overFilm} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition ${
                overFilm
                  ? "text-white/85 hover:text-white"
                  : "text-slate-600 hover:text-violet-700"
              }`}
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
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              overFilm
                ? "border-white/30 text-white hover:bg-white/10"
                : "border-slate-200 text-slate-700 hover:border-violet-200 hover:bg-violet-50"
            }`}
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
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border lg:hidden ${
            overFilm ? "border-white/30 text-white" : "border-slate-200"
          }`}
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