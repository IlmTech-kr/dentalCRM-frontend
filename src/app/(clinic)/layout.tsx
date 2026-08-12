"use client";

/**
 * Tekshiruvlar:
 * 1. currentSubdomain yo'q          → /login
 * 2. storedUser yo'q                → /login (cookie ham yo'q deb hisoblanadi)
 * 3. Route uchun rol mos emas       → /dashboard (access.ts, CLINIC_ACCESS_RULES)
 * 4. Hammasi OK                     → DashboardLayout ko'rsatiladi
 *
 * Eslatma: subDomain solishtirish (localStorage vs URL) OLIB TASHLANDI.
 * subDomain endi localStorage'da saqlanmaydi — chunki bu eski/boshqa
 * tenant qiymati qolib ketib, to'g'ri tenant uchun ham noto'g'ri
 * "boshqa clinic" deb topilishiga (yoki aksincha) olib kelardi.
 *
 * Tenant/token mosligi backendda tekshiriladi: har bir so'rovda cookie
 * (token) va Host header (subdomain) solishtiriladi. Mos kelmasa backend
 * 403 AUTH_TENANT_MISMATCH qaytaradi — LEKIN http.ts interceptori bu
 * kodni ko'rib avtomatik /login'ga ENDI YO'NALTIRMAYDI, chunki backend
 * shu xuddi shu kodni oddiy rol-ruxsat tekshiruvlarida ham qaytarib,
 * ruxsati yo'q foydalanuvchilarni har safar sessiyadan chiqarib
 * yuborayotgani aniqlandi (masalan /statistics/revenue, /subscriptions/
 * current, /admin/users). 403 endi shunchaki oddiy xato sifatida har bir
 * hook'ning o'z xato-ko'rsatishiga tushadi — butun sessiyani yiqitmaydi.
 * Haqiqiy sessiya yaroqsizligi 401 orqali to'g'ri ushlanadi.
 *
 * Bu layout (clinic) ichidagi route'lar orasida qayta mount BO'LMAYDI —
 * shuning uchun rol tekshiruvi pathname o'zgarganda alohida effekt sifatida
 * qayta ishga tushadi (pastdagi ikkinchi useEffect). Faqat mount-vaqtidagi
 * bitta tekshiruv yetarli bo'lmaydi: masalan DOCTOR /dashboard'dan
 * to'g'ridan-to'g'ri /patients'ga client-side navigatsiya qilsa, layout hech
 * qachon qayta mount bo'lmagani uchun birinchi effekt qayta ishlamaydi.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardLayout from "./_components/DashboardLayout";
import SessionGate from "@/src/components/shared/SessionGate";
import { getCurrentSubdomain } from "@/src/lib/tenant.client";
import { getStoredUser, clearAuthStorage } from "@/src/lib/auth/storage";
import { useAuthStore } from "@/src/store/auth.store";
import { CLINIC_ACCESS_RULES, isRouteAllowed } from "@/src/config/access";

export default function ClinicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const initDone = useRef(false);

  // Bir martalik sessiya tekshiruvi: subdomain + storedUser bor-yo'qligi.
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const currentSubDomain = getCurrentSubdomain();
    const savedUser = getStoredUser();

    // Subdomain yo'q
    if (!currentSubDomain) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    // User yo'q — logout qilingan yoki sessiya yo'q
    if (!savedUser) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    // Hammasi to'g'ri. Tenant/token mosligi (401) keyingi API
    // so'rovlarida http.ts interceptori orqali tekshiriladi — shu yerda
    // qo'shimcha tekshiruv shart emas. (403 endi avtomatik logout
    // qilmaydi, sabab uchun http.ts'dagi izohga qarang.)
    useAuthStore.getState().setAuthData({
      user: savedUser as any,
      isAuthenticated: true,
    });

    setChecked(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rol tekshiruvi — har bir client-side navigatsiyada qayta ishlaydi
  // (layout qayta mount bo'lmagani uchun pathname'ga bog'liq).
  useEffect(() => {
    if (!checked) return;

    const roles = useAuthStore.getState().user?.roles || [];

    if (!isRouteAllowed(pathname, roles, CLINIC_ACCESS_RULES)) {
      router.replace("/dashboard");
    }
  }, [checked, pathname, router]);

  return (
    <SessionGate ready={checked}>
      <DashboardLayout>{children}</DashboardLayout>
    </SessionGate>
  );
}