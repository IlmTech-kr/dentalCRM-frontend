"use client";

/**
 * File: src/app/subdomains/page.tsx
 *
 * dental.ilmtech.uz/subdomains — foydalanuvchi klinika subdomainini kiritadi:
 * - GET /api/auth/check/subdomain/exists?subdomain={value} (mainHttp,
 *   root domain so'rovi — hali qaysi tenant ekanligi noma'lum bo'lgani
 *   uchun tenantHttp emas).
 * - Agar subdomain MAVJUD bo'lsa → https://{subdomain}.dental.ilmtech.uz
 *   ga yo'naltiriladi (butunlay boshqa domen bo'lgani uchun
 *   window.location.href, Next router emas).
 * - Agar MAVJUD BO'LMASA → /register sahifasiga yo'naltiriladi
 *   (kiritilgan subdomain ?subdomain= query orqali uzatiladi, forma
 *   qulayligi uchun).
 */

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Loader2, Search } from "lucide-react";

import { mainHttp, getApiErrorMessage, publicMainHttp, MAIN_API_URL } from "@/src/lib/api/http";
import axios from "axios";

const ROOT_DOMAIN = "dental.ilmtech.uz";

function normalizeSubdomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Backend javobi turli shaklda kelishi mumkin:
 * - to'g'ridan-to'g'ri boolean
 * - { exists: boolean }
 * - { data: { exists: boolean } }
 * - { data: boolean }
 * Barcha variantlar qo'llab-quvvatlanadi.
 */
function extractExists(result: any): boolean {
  if (typeof result === "boolean") return result;
  if (typeof result?.exists === "boolean") return result.exists;
  if (typeof result?.data === "boolean") return result.data;
  if (typeof result?.data?.exists === "boolean") return result.data.exists;
  return false;
}

export default function SubdomainCheckPage() {
  const router = useRouter();

  const [subdomain, setSubdomain] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const value = normalizeSubdomain(subdomain);

    if (!value) {
      setErrorMessage("Subdomain kiriting.");
      return;
    }

    setIsChecking(true);

    try {
      const response = await axios.get(
        `${MAIN_API_URL}/api/auth/check/subdomain/exists?subdomain=${encodeURIComponent(value)}`
      );

      const exists = extractExists(response.data);

      if (exists) {
        // Boshqa domen (subdomain.dental.ilmtech.uz) — Next router emas,
        // to'liq sahifa o'tishi kerak.
        window.location.href = `https://${value}.${ROOT_DOMAIN}`;
      } else {
        router.push(`/register?subdomain=${encodeURIComponent(value)}`);
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Subdomainni tekshirishda xatolik yuz berdi."));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC] p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35a8f5] text-white shadow-lg shadow-blue-200">
            <Building2 size={26} />
          </div>
          <h1 className="text-2xl font-extrabold text-dark-navy">Klinikangizni toping</h1>
          <p className="mt-2 text-sm text-text-light">
            Klinikangizning subdomainini kiriting — sizni to'g'ri sahifaga yo'naltiramiz.
          </p>
        </div>

        <div className="rounded-3xl border border-border-color bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Subdomain</label>
              <div className="flex items-center overflow-hidden rounded-2xl border border-border-color bg-slate-50 transition focus-within:border-[#35a8f5] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#35a8f5]/10">
                <span className="pl-4 text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  autoFocus
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="masalan: clinic11"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm font-semibold text-dark-navy outline-none placeholder:text-slate-400"
                />
                <span className="shrink-0 pr-4 text-sm font-semibold text-slate-400">
                  .{ROOT_DOMAIN}
                </span>
              </div>
              {errorMessage && (
                <p className="mt-2 text-sm font-semibold text-red-600">{errorMessage}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChecking || !subdomain.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#35a8f5] px-4 py-3.5 text-sm font-black text-white shadow-md shadow-blue-200 transition hover:bg-[#1d8ee8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {isChecking ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Tekshirilmoqda...
                </>
              ) : (
                <>
                  Davom etish
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-text-light">
          Klinikangiz hali ro'yxatdan o'tmaganmi?{" "}
          <a href="/register" className="font-bold text-[#35a8f5] hover:underline">
            Ro'yxatdan o'tish
          </a>
        </p>
      </div>
    </div>
  );
}