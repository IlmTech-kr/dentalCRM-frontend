"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Mail, Phone } from "lucide-react";
import { LogoMark, BRAND } from "@/src/components/shared/BrandLogo";
import { useSocialsStore } from "@/src/store/socials.store";
import { useGetPublicClinicProfile } from "@/src/features/clinicProfile/hooks/useClinicProfile";
import { buildTenantBaseUrl } from "@/src/lib/api/http";
import { getCurrentSubdomain } from "@/src/lib/tenant.client";
import {
  PlatformIcon,
  SOCIAL_PLATFORM_COLOR,
  SOCIAL_PLATFORM_LABEL,
} from "@/src/features/socials/platformConfig";
import type { ClinicPublicProfile } from "@/src/types/clinicProfile.types";
import type { SocialPlatform } from "@/src/types/social.types";

/** Telefon/email uchun ranglar — mavjud brend ranglariga (Instagram/Facebook/...) urilib qolmasligi uchun tanlangan. */
const PHONE_COLOR = "#22C55E";
const EMAIL_COLOR = "#3ba5f6";

/**
 * Ro'yxat/doira ko'rinishlari endi faqat social havolalarni emas, telefon
 * va emailni ham "socials kabi" bir xil kartochka/orb uslubida
 * ko'rsatadi — shuning uchun ikkalasi ham shu umumiy shaklga keltiriladi.
 * Bu FAQAT ko'rsatish uchun (client-side birlashtirish) — backendga hech
 * narsa qo'shilmaydi, phoneNumber/email profil maydonlari o'zgarishsiz
 * qoladi. `iconKind` — glif turli o'lchamda (ro'yxatda 18px, ringda
 * 48-72px) qayta chizilishi kerak, shuning uchun tayyor ReactNode emas,
 * shu discriminant saqlanadi (bkz. EntryIcon).
 */
interface ContactEntry {
  key: string;
  url: string;
  label: string;
  color: string;
  iconKind: SocialPlatform | "PHONE" | "EMAIL";
}

function EntryIcon({ entry, size }: { entry: ContactEntry; size: number }) {
  if (entry.iconKind === "PHONE") return <Phone size={size} />;
  if (entry.iconKind === "EMAIL") return <Mail size={size} />;
  return <PlatformIcon platform={entry.iconKind} size={size} />;
}

/**
 * Telefon/email SOCIALS RO'YXATINING BOSHIDA chiqadi — eng tez-tez kerak
 * bo'ladigan aloqa yo'llari sifatida. Kartochkada raqam/manzilning o'zi
 * emas, umumiy yorliq ("Phone number" / "Email") ko'rsatiladi — haqiqiy
 * qiymat faqat tel:/mailto: havolasida ishlatiladi.
 */
function buildContactEntries(
  profile: ClinicPublicProfile | undefined,
  labels: { phone: string; email: string }
): ContactEntry[] {
  const entries: ContactEntry[] = [];

  if (profile?.phoneNumber) {
    entries.push({
      key: "phone",
      url: `tel:${profile.phoneNumber}`,
      label: labels.phone,
      color: PHONE_COLOR,
      iconKind: "PHONE",
    });
  }

  if (profile?.email) {
    entries.push({
      key: "email",
      url: `mailto:${profile.email}`,
      label: labels.email,
      color: EMAIL_COLOR,
      iconKind: "EMAIL",
    });
  }

  const links = [...(profile?.socials ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const link of links) {
    entries.push({
      key: link.platform,
      url: link.url,
      label: SOCIAL_PLATFORM_LABEL[link.platform],
      color: SOCIAL_PLATFORM_COLOR[link.platform],
      iconKind: link.platform,
    });
  }

  return entries;
}

/** Hex rangga alfa (shaffoflik) qo'shadi — border/shadow uchun ranglarni yumshoq qiladi. */
function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function isExternalUrl(url: string): boolean {
  return !url.startsWith("tel:") && !url.startsWith("mailto:");
}

/** `imageUrl` backenddan "/api/storage/..." kabi nisbiy yo'l sifatida keladi — joriy tenant bazaviy URL'iga biriktiriladi. To'liq URL bo'lsa (http/https) o'zgarishsiz qaytadi. */
function resolveClinicImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  const subdomain = getCurrentSubdomain();
  if (!subdomain) return imageUrl;

  try {
    return `${buildTenantBaseUrl(subdomain)}${imageUrl}`;
  } catch {
    return imageUrl;
  }
}

/**
 * Ro'yxat ko'rinishi — har bir qator (social havola, telefon yoki email)
 * pastdan tepaga "pop-in" bilan ketma-ket (staggered) paydo bo'ladi.
 */
function SocialListView({ entries }: { entries: ContactEntry[] }) {
  return (
    <div className="w-full space-y-3">
      {entries.map((entry, index) => (
        <a
          key={entry.key}
          href={entry.url}
          target={isExternalUrl(entry.url) ? "_blank" : undefined}
          rel={isExternalUrl(entry.url) ? "noopener noreferrer" : undefined}
          className="flex items-center gap-3 rounded-2xl border-2 bg-white/90 px-5 py-4 backdrop-blur transition duration-200 hover:-translate-y-0.5"
          style={{
            borderColor: withAlpha(entry.color, "40"),
            boxShadow: `0 10px 26px -12px ${withAlpha(entry.color, "99")}`,
            animation: `socials-pop-in 0.45s ease-out ${index * 70}ms both`,
          }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: entry.color, boxShadow: `0 6px 14px -4px ${withAlpha(entry.color, "aa")}` }}
          >
            <EntryIcon entry={entry} size={18} />
          </span>
          <span className="flex-1 truncate text-sm font-bold text-dark-navy">{entry.label}</span>
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
function SocialOrb({ entry, size, delay }: { entry: ContactEntry; size: number; delay: number }) {
  const { color, label } = entry;

  return (
    <a
      href={entry.url}
      target={isExternalUrl(entry.url) ? "_blank" : undefined}
      rel={isExternalUrl(entry.url) ? "noopener noreferrer" : undefined}
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
        <EntryIcon entry={entry} size={Math.round(size * 0.42)} />
      </span>

      <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </a>
  );
}

/**
 * Doira ko'rinishi — haqiqiy RING: ikonkalar doira bo'ylab teng
 * masofada, markazda klinika logotipi/nomi. 2 tagacha havola bo'lsa ring
 * geometriyasi ortiqcha (o'rtada bo'sh joy qolib ketadi) — shunchaki
 * markazlashgan qator sifatida ko'rsatiladi.
 */
function SocialCircleView({ entries }: { entries: ContactEntry[] }) {
  const count = entries.length;

  if (count <= 2) {
    return (
      <div className="flex items-center justify-center gap-6">
        {entries.map((entry, index) => (
          <SocialOrb key={entry.key} entry={entry} size={72} delay={index * 110} />
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

      {/* Markaz — Dental CRM (platforma) brendi, dental.ilmtech.uz'ga olib boradi.
          Klinika logotipi/nomi endi yuqorida — bu yerda takrorlanmaydi. */}
      <a
        href="https://dental.ilmtech.uz"
        target="_blank"
        rel="noopener noreferrer"
        title={BRAND}
        className="group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
        style={{ animation: "socials-pop-in 0.5s ease-out 200ms both" }}
      >
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white shadow-[0_16px_32px_-10px_rgba(56,189,248,0.55),0_8px_20px_-6px_rgba(167,139,250,0.45)] ring-2 ring-slate-200 transition-transform duration-300 group-hover:scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/social_logo.png" alt={BRAND} className="h-full w-full object-cover" />
        </div>
        <span className="text-sm font-extrabold tracking-tight text-dark-navy">
          Dental <span className="bg-gradient-to-r from-sky-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">CRM</span>
        </span>
      </a>

      {/* Ring bo'ylab joylashgan orb'lar */}
      {entries.map((entry, index) => {
        const theta = (-90 + (360 / count) * index) * (Math.PI / 180);
        const x = 50 + RING_RADIUS_PCT * Math.cos(theta);
        const y = 50 + RING_RADIUS_PCT * Math.sin(theta);

        return (
          <div
            key={entry.key}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <SocialOrb entry={entry} size={orbSize} delay={index * 110} />
          </div>
        );
      })}
    </div>
  );
}

export default function PublicSocialsPage() {
  const t = useTranslations("settings.socials.profile");
  const isDisplayModeHydrated = useSocialsStore((s) => s.isHydrated);
  const hydrateFromStorage = useSocialsStore((s) => s.hydrateFromStorage);
  const displayMode = useSocialsStore((s) => s.displayMode);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const { data: profile, isLoading } = useGetPublicClinicProfile();

  const entries = buildContactEntries(profile, { phone: t("phoneLabel"), email: t("emailLabel") });
  const companyName = profile?.companyName?.trim() || BRAND;
  const imageSrc = resolveClinicImageUrl(profile?.imageUrl);
  const isCircle = displayMode === "circle";
  const isReady = isDisplayModeHydrated && !isLoading;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-violet-50 px-6 py-16 pb-12">
      {/* Logotip/nom/bio endi ikkala rejimda ham yuqorida bir marta chiqadi — doira rejimida ring markazida takrorlanmaydi. */}
      <div
        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-100"
        style={{ animation: "socials-pop-in 0.5s ease-out both" }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={companyName} className="h-full w-full object-cover" />
        ) : (
          <LogoMark />
        )}
      </div>
      <h1
        className="mt-5 text-xl font-extrabold text-dark-navy"
        style={{ animation: "socials-pop-in 0.5s ease-out 60ms both" }}
      >
        {companyName}
      </h1>
      {profile?.bio && (
        <p
          className="mt-1 max-w-sm text-center text-sm text-text-light"
          style={{ animation: "socials-pop-in 0.5s ease-out 100ms both" }}
        >
          {profile.bio}
        </p>
      )}

      <div className={`mt-10 w-full ${isCircle ? "max-w-lg" : "max-w-md"}`}>
        {!isReady ? null : entries.length === 0 ? (
          <p className="text-center text-sm text-text-light">—</p>
        ) : displayMode === "list" ? (
          <SocialListView entries={entries} />
        ) : (
          <SocialCircleView entries={entries} />
        )}
      </div>
    </main>
  );
}
