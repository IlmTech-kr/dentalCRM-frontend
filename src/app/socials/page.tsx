"use client";

import { useEffect } from "react";
import { LogoMark, BRAND } from "@/src/components/shared/BrandLogo";
import { useSocialsStore } from "@/src/store/socials.store";
import {
  PlatformIcon,
  SOCIAL_PLATFORM_COLOR,
  SOCIAL_PLATFORM_LABEL,
} from "@/src/features/socials/platformConfig";
import type { SocialLink } from "@/src/types/social.types";

/**
 * Ro'yxat ko'rinishi — har bir havola pastdan tepaga "pop-in" bilan
 * ketma-ket (staggered) paydo bo'ladi.
 */
function SocialListView({ links }: { links: SocialLink[] }) {
  return (
    <div className="w-full space-y-3">
      {links.map((link, index) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/85 px-5 py-4 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ animation: `socials-pop-in 0.45s ease-out ${index * 70}ms both` }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: SOCIAL_PLATFORM_COLOR[link.platform] }}
          >
            <PlatformIcon platform={link.platform} size={18} />
          </span>
          <span className="flex-1 truncate text-sm font-bold text-dark-navy">
            {link.label || SOCIAL_PLATFORM_LABEL[link.platform]}
          </span>
        </a>
      ))}
    </div>
  );
}

const SOCIAL_SPIN_IN_MS = 700;
const RING_RADIUS_PCT = 37;

/**
 * Bitta "orb" — UCH ichma-ich element, har biri BITTA transform tashvishi
 * bilan (aks holda animatsiyalar bir-birini bosib, ring markazlashuvini
 * (translate(-50%,-50%), tashqi <div>da, SocialCircleView'da) buzib
 * qo'yadi):
 *   1. tashqi <div> (SocialCircleView'da)  → statik pozitsiya (left/top %)
 *   2. <a>                                  → socials-pop-in (kirish)
 *   3. ichki <span>                         → socials-spin-in + socials-float
 * Yorliq ring geometriyasini buzmasligi uchun inline oqim matni EMAS —
 * orb ostida hover'da chiqadigan tooltip sifatida ko'rsatiladi.
 */
function SocialOrb({ link, size, delay }: { link: SocialLink; size: number; delay: number }) {
  const color = SOCIAL_PLATFORM_COLOR[link.platform];
  const label = link.label || SOCIAL_PLATFORM_LABEL[link.platform];

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="group relative block"
      style={{ animation: `socials-pop-in 0.5s ease-out ${delay}ms both` }}
    >
      <span
        className="flex items-center justify-center rounded-full text-white ring-4 ring-white/90 transition-transform duration-300 ease-out group-hover:scale-110"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: `0 10px 24px -8px ${color}99`,
          animation: `socials-spin-in ${SOCIAL_SPIN_IN_MS}ms ease-out ${delay}ms both, socials-float 3.6s ease-in-out ${
            delay + SOCIAL_SPIN_IN_MS
          }ms infinite`,
        }}
      >
        <PlatformIcon platform={link.platform} size={Math.round(size * 0.42)} />
      </span>

      <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </a>
  );
}

/**
 * Doira ko'rinishi — haqiqiy RING: ikonkalar doira bo'ylab teng
 * masofada, markazda brend logotipi. 2 tagacha havola bo'lsa ring
 * geometriyasi ortiqcha (o'rtada bo'sh joy qolib ketadi) — shunchaki
 * markazlashgan qator sifatida ko'rsatiladi.
 */
function SocialCircleView({ links }: { links: SocialLink[] }) {
  const count = links.length;

  if (count <= 2) {
    return (
      <div className="flex items-center justify-center gap-6">
        {links.map((link, index) => (
          <SocialOrb key={link.id} link={link} size={72} delay={index * 110} />
        ))}
      </div>
    );
  }

  const orbSize = count <= 6 ? 64 : count <= 9 ? 56 : 48;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[420px]">
      {/* Xira, sekin aylanuvchi gradient halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="h-[85%] w-[85%] rounded-full opacity-25 blur-3xl"
          style={{
            background: "conic-gradient(from 0deg, #38bdf8, #a78bfa, #f472b6, #38bdf8)",
            animation: "socials-halo-spin 16s linear infinite",
          }}
        />
      </div>

      {/* Punktir orbit chizig'i — orb'lar aynan shu radiusda turadi */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full border border-dashed border-slate-300/70"
        style={{
          inset: `${50 - RING_RADIUS_PCT}%`,
          animation: "socials-halo-spin 40s linear infinite",
        }}
      />

      {/* Markaz — brend logotipi */}
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
        style={{ animation: "socials-pop-in 0.5s ease-out 200ms both" }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-slate-100">
          <LogoMark />
        </div>
        <p className="text-xs font-extrabold text-dark-navy">{BRAND}</p>
      </div>

      {/* Ring bo'ylab joylashgan orb'lar */}
      {links.map((link, index) => {
        const theta = (-90 + (360 / count) * index) * (Math.PI / 180);
        const x = 50 + RING_RADIUS_PCT * Math.cos(theta);
        const y = 50 + RING_RADIUS_PCT * Math.sin(theta);

        return (
          <div
            key={link.id}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <SocialOrb link={link} size={orbSize} delay={index * 110} />
          </div>
        );
      })}
    </div>
  );
}

export default function PublicSocialsPage() {
  const isHydrated = useSocialsStore((s) => s.isHydrated);
  const hydrateFromStorage = useSocialsStore((s) => s.hydrateFromStorage);
  const links = useSocialsStore((s) => s.links);
  const displayMode = useSocialsStore((s) => s.displayMode);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const isCircle = displayMode === "circle";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-violet-50 px-6 py-16 pb-12">
      {/* Doira rejimida logotip/nom ringning markazida chiqadi — bu yerda takrorlanmaydi. */}
      {!isCircle && (
        <>
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg ring-1 ring-slate-100"
            style={{ animation: "socials-pop-in 0.5s ease-out both" }}
          >
            <LogoMark />
          </div>
          <h1
            className="mt-5 text-xl font-extrabold text-dark-navy"
            style={{ animation: "socials-pop-in 0.5s ease-out 60ms both" }}
          >
            {BRAND}
          </h1>
        </>
      )}

      <div className={`w-full ${isCircle ? "mt-4 max-w-lg" : "mt-10 max-w-md"}`}>
        {!isHydrated ? null : links.length === 0 ? (
          <p className="text-center text-sm text-text-light">—</p>
        ) : displayMode === "list" ? (
          <SocialListView links={links} />
        ) : (
          <SocialCircleView links={links} />
        )}
      </div>
    </main>
  );
}
