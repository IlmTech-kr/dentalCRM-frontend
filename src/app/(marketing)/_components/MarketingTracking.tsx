"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { publicMainHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

type Consent = "accepted" | "rejected" | null;

const CONSENT_COOKIE = "dental_cookie_consent";
const VISITOR_COOKIE = "dental_marketing_visitor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
const CONSENT_EVENT = "dental-consent-change";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const item = document.cookie.split("; ").find((value) => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function setCookie(name: string, value: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const domain = window.location.hostname.endsWith(".ilmtech.uz")
    ? "; Domain=.ilmtech.uz"
    : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}${domain}`;
}

function ensureVisitorCookie(): string {
  const current = getCookie(VISITOR_COOKIE);
  if (current) return current;
  const value = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  setCookie(VISITOR_COOKIE, value);
  return value;
}

export default function MarketingTracking() {
  const pathname = usePathname();
  const t = useTranslations("layout");
  const consent = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(CONSENT_EVENT, onStoreChange);
      return () => window.removeEventListener(CONSENT_EVENT, onStoreChange);
    },
    () => {
      const saved = getCookie(CONSENT_COOKIE);
      return saved === "accepted" || saved === "rejected" ? saved : null;
    },
    () => null,
  );
  const sentPaths = useRef(new Set<string>());

  useEffect(() => {
    if (consent !== "accepted" || sentPaths.current.has(pathname)) return;
    sentPaths.current.add(pathname);
    ensureVisitorCookie();
    void publicMainHttp.post(ENDPOINTS.marketing.recordVisit, { path: pathname }).catch(() => {
      sentPaths.current.delete(pathname);
    });
  }, [consent, pathname]);

  function chooseConsent(value: Exclude<Consent, null>) {
    setCookie(CONSENT_COOKIE, value);
    if (value === "accepted") ensureVisitorCookie();
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  if (consent !== null) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[10000] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/15 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-md">
      <p className="text-sm font-bold text-slate-900">{t("cookieConsent.title")}</p>
      <p className="mt-1.5 text-xs leading-5 text-slate-500">
        {t("cookieConsent.description")}
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => chooseConsent("accepted")} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700">
          {t("cookieConsent.accept")}
        </button>
        <button type="button" onClick={() => chooseConsent("rejected")} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
          {t("cookieConsent.reject")}
        </button>
      </div>
    </aside>
  );
}
