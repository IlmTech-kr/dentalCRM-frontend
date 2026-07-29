"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, Mail, ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";

import { useLogin } from "@/src/features/auth/hooks/useAuth";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { getCurrentSubdomain } from "@/src/lib/tenant.client";
import { getMe } from "@/src/features/users/user.service";
import { useAuthStore } from "@/src/store/auth.store";
import { getStoredUser, saveUser, clearAuthStorage } from "@/src/lib/auth/storage";
import SessionGate from "@/src/components/shared/SessionGate";

function getErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: string }).message || fallback);
  }
  return fallback;
}

function getErrorStatus(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "status" in error) {
    return (error as any).status ?? null;
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("auth");
  const loginMutation = useLogin();
  const setAuthData = useAuthStore((state) => state.setAuthData);

  const [mounted, setMounted] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const initDone = useRef(false);
  const tenantMissing = mounted && !tenantSubdomain;

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    async function initLoginPage() {
      const currentSubdomain = getCurrentSubdomain();

      setTenantSubdomain(currentSubdomain);
      setMounted(true);

      if (!currentSubdomain) {
        setCheckingSession(false);
        return;
      }

      try {
        const savedLogin = localStorage.getItem("savedLogin");
        if (savedLogin) {
          const parsed = JSON.parse(savedLogin);
          setForm((prev) => ({ ...prev, email: parsed.email || "" }));
          setRememberMe(true);
        }
      } catch {
        localStorage.removeItem("savedLogin");
      }

      const storedUser = getStoredUser();

      // storedUser yo'q → sessiya yo'q → login forma
      if (!storedUser) {
        setCheckingSession(false);
        return;
      }

      try {
        /**
         * getMe() 401 bersa — http.ts interceptor avval refresh qiladi.
         * Refresh muvaffaqiyatli → getMe() muvaffaqiyatli qaytadi.
         * Refresh ham fail → interceptor clearAuthStorage + /login redirect qiladi.
         * Shuning uchun bu yerda catch da faqat network yoki boshqa xatolarni
         * handle qilamiz — 401 ni interceptor o'zi hal qiladi.
         */
        const me = await getMe();
        saveUser(me);
        setAuthData({ user: me as any, isAuthenticated: true });
        router.replace("/dashboard");
      } catch (error) {
        const status = getErrorStatus(error);

        /**
         * 401 — interceptor allaqachon refresh uringan va fail bo'lgan.
         *        redirectToLogin() chaqirilgan — bu yerda hech narsa qilmaymiz.
         * Boshqa xato (network, 500) — storedUser stale bo'lishi mumkin,
         *        lekin cookie valid bo'lishi ham mumkin, shuning uchun
         *        localStorage ni tozalamaymiz — faqat login forma ko'rsatamiz.
         */
        if (status === 401) {
          // interceptor allaqachon hal qilgan — bu yerga yetib kelmasligi kerak
          // agar yetib kelsa, storedUser ni tozalaymiz
          clearAuthStorage();
        }

        setCheckingSession(false);
      }
    }

    initLoginPage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const email = form.email.trim();
    const password = form.password;

    if (!tenantSubdomain) { toast.error(t("login.errors.tenantNotFound")); return; }
    if (!email || !password) { toast.error(t("login.errors.missingFields")); return; }

    try {
      await loginMutation.mutateAsync({ email, password });

      if (rememberMe) {
        localStorage.setItem("savedLogin", JSON.stringify({ email }));
      } else {
        localStorage.removeItem("savedLogin");
      }

      toast.success(t("login.success"));
      router.replace("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, t("login.errors.loginFailed")));
    }
  }

  return (
    <SessionGate ready={!checkingSession} loadingText={t("login.checkingSession")}>
    <main className="min-h-screen bg-light-background lg:grid lg:grid-cols-[48%_52%]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#3498db] px-14 py-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-28 top-20 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-36 right-10 h-[430px] w-[430px] rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 shadow-lg">
            <ShieldCheck size={34} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t("brand.name")}</h1>
            <p className="text-base text-white/85">{t("login.tagline")}</p>
          </div>
        </div>
        <div className="relative z-10 mt-[150px] max-w-[620px]">
          <h2 className="text-[54px] font-extrabold leading-[1.15] tracking-tight">
            {t("login.heroTitle")}
          </h2>
          <p className="mt-8 text-xl leading-9 text-white/90">
            {t("login.heroSubtitle")}
          </p>
        </div>
        <p className="relative z-10 mt-auto text-sm text-white/75">{t("login.copyright")}</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[500px] rounded-[28px] border border-border-color bg-white px-9 py-10 shadow-2xl shadow-slate-300/40"
        >
          <h2 className="text-[38px] font-extrabold leading-tight text-dark-navy">{t("login.title")}</h2>
          <p className="mt-3 text-base text-text-light">{t("login.subtitle")}</p>

          {tenantMissing && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 text-red-500" />
                <div>
                  <p className="text-sm font-bold text-red-700">{t("login.tenantMissingTitle")}</p>
                  <p className="mt-1 text-sm text-red-600">{t("login.tenantMissingHint")}</p>
                  <p className="mt-2 rounded-md bg-white px-3 py-2 font-mono text-xs text-red-700">
                    http://clinic1.localhost:3000/login
                  </p>
                </div>
              </div>
            </div>
          )}

          {loginMutation.error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-700">
                {getErrorMessage(loginMutation.error, t("login.errors.loginFailed"))}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">{t("login.emailLabel")}</label>
              <div className="flex h-16 items-center gap-3 rounded-2xl border border-border-color bg-slate-50 px-5">
                <Mail size={21} className="text-slate-400" />
                <input
                  type="email"
                  className="h-full w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder={t("login.emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={loginMutation.isPending || tenantMissing}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">{t("login.passwordLabel")}</label>
              <div className="flex h-16 items-center gap-3 rounded-2xl border border-border-color bg-slate-50 px-5">
                <Lock size={21} className="text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="h-full w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder={t("login.passwordPlaceholder")}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loginMutation.isPending || tenantMissing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-400 transition hover:text-primary-blue"
                  disabled={loginMutation.isPending || tenantMissing}
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 accent-[#35a8f5]"
                  disabled={loginMutation.isPending || tenantMissing}
                />
                {t("login.rememberMe")}
              </label>
            </div>

            <button
              type="submit"
              disabled={tenantMissing || loginMutation.isPending || !form.email.trim() || !form.password}
              className="h-16 w-full rounded-2xl bg-[#35a8f5] text-lg font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1d8ee8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? t("login.submitting") : t("login.submitButton")}
            </button>
          </div>
        </form>
      </section>
    </main>
    </SessionGate>
  );
}