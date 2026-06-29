"use client";

import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Send,
  Mail,
  MapPin,
} from "lucide-react";
import { BRAND, BrandLogo } from "@/src/components/shared/BrandLogo";

const productLinks = [
  { label: "Imkoniyatlar", href: "/#features" },
  { label: "Qanday ishlaydi", href: "/#how-it-works" },
  { label: "Tariflar", href: "/tariffs" },
  { label: "Demo so'rovi", href: "/#contact" },
];

const companyLinks = [
  { label: "Biz haqimizda", href: "/#about" },
  { label: "Bog'lanish", href: "/#contact" },
  { label: "Maxfiylik siyosati", href: "/#" },
  { label: "Foydalanish shartlari", href: "/#" },
];

const socials = [
  {
    label: "Telegram",
    href: "https://t.me/dentalcrm",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/dentalcrm",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com/dentalcrm",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/dentalcrm",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

interface FooterProps {
  onDemoClick?: () => void;
}

export default function Footer({ onDemoClick }: FooterProps = {}) {
  return (
    <footer id="contact" className="bg-[#07105f]">
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Klinikangizni raqamlashtirishga tayyormisiz?
              </h3>
              <p className="mt-2 max-w-2xl text-sky-100/75">
                Demo so'rang — jamoamiz klinikangizga mos START, PRO yoki
                ENTERPRISE yechimni tanlab beradi.
              </p>
            </div>

            <button
              type="button"
              onClick={onDemoClick}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-rose-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-950/30 transition-all hover:scale-[1.02]"
            >
              Demo olish
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <BrandLogo dark />

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-sky-100/70">
              {BRAND} — stomatologiya klinikalari uchun zamonaviy CRM:
              bemorlar, shifokorlar, qabullar, davolash kartalari, hisobotlar
              va SMS eslatmalar bitta platformada.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-sky-100/70 transition-colors hover:border-sky-300/50 hover:text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Mahsulot</p>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-sky-100/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Kompaniya</p>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-sky-100/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Aloqa</p>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3 text-sm text-sky-100/70">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <div>
                  <p className="text-white">+998 90 123 45 67</p>
                  <p className="text-xs text-sky-100/50">Dush-Shanba, 09:00–18:00</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-sky-100/70">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <div>
                  <p className="text-white">info@dentalcrm.uz</p>
                  <p className="text-xs text-sky-100/50">Savol va takliflar uchun</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-sky-100/70">
                <Send className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <div>
                  <p className="text-white">@dentalcrm_support</p>
                  <p className="text-xs text-sky-100/50">Tezkor javob — Telegram</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-sky-100/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <div>
                  <p className="text-white">Toshkent, O'zbekiston</p>
                  <p className="text-xs text-sky-100/50">Online demo va joriy qilish xizmati</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-center sm:flex-row sm:text-left lg:px-8">
          <p className="text-sm text-sky-100/50">
            © {new Date().getFullYear()} {BRAND}. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/#" className="text-sm text-sky-100/50 transition-colors hover:text-white">Maxfiylik siyosati</Link>
            <Link href="/#" className="text-sm text-sky-100/50 transition-colors hover:text-white">Foydalanish shartlari</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}