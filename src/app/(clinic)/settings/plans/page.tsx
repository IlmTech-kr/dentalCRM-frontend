"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  HardDrive,
  MessageCircle,
  RefreshCcw,
  Sparkles,
  UserRound,
  Users,
  Zap,
  ZapOff,
} from "lucide-react";

import DentalLoader, { DentalLoaderIcon } from "@/src/components/ui/DentalLoader";

import {
  useCancelPlan,
  useGetCurrentPlan,
  useGetPlans,
} from "@/src/features/subscriptions/hooks/useSubscription";
import { useToast } from "@/src/lib/hooks/Usetoast";
import { useConfirm } from "@/src/lib/hooks/Useconfirm";

import type {
  CurrentSubscription,
  PlanType,
  SubscriptionPlan,
} from "@/src/types/subscription.types";
import type { CreatePaymentOrderDto } from "@/src/types/payment.types";
import { useActivatePlanPayment } from "@/src/features/payment/hooks/hooks";

type TabType = "current" | "available";

function getDurationOptions(t: ReturnType<typeof useTranslations>) {
  return [
    { months: 1, label: t("durations.months1") },
    { months: 3, label: t("durations.months3") },
    { months: 6, label: t("durations.months6") },
    { months: 12, label: t("durations.months12"), badge: t("durations.discountBadge") },
  ];
}

const INT_MAX = 2147483647;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("uz-UZ").format(Number(value));
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

/**
 * Baytlarni o'qiladigan ko'rinishga o'giradi: B / KB / MB / GB / TB.
 *
 * MUHIM: avvalgi `bytesToGb` 1 MB dan kichik qiymatlarni 0 ga aylantirib
 * yuborardi (312793 B → "0 GB"). Bu funksiya birlikni avtomatik tanlaydi.
 *
 * `forceDecimals` — "10.0 GB jami" va "10.0 GB bo'sh" bir xil ko'rinmasligi
 * uchun qolgan hajmga qo'shimcha aniqlik berish imkonini beradi.
 */
function formatBytes(bytes?: number | null, forceDecimals?: number): string {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / Math.pow(1024, i);

  const decimals =
    forceDecimals !== undefined ? forceDecimals : i <= 1 ? 0 : scaled >= 100 ? 0 : 1;

  return `${scaled.toFixed(decimals)} ${units[i]}`;
}

/** Tariflar ro'yxatida GB darajasidagi qiymatlar uchun (PlanCard) */
function bytesToGb(bytes?: number | null): number {
  if (!bytes) return 0;
  return Math.round((bytes / 1024 ** 3) * 10) / 10;
}

function limitLabel(value?: number | null): string {
  if (value === null || value === undefined || value >= INT_MAX) return "∞";
  return String(value);
}

function matchPlanType(raw: string): PlanType | null {
  const normalized = raw.trim().toUpperCase();
  if (normalized.includes("START")) return "START";
  if (normalized.includes("PRO")) return "PRO";
  if (normalized.includes("ENTERPRISE")) return "ENTERPRISE";
  return null;
}

function getPlanType(plan?: SubscriptionPlan | null): PlanType | null {
  return matchPlanType(
    String(plan?.planType || plan?.type || plan?.name || plan?.title || "")
  );
}

function getPlanKey(plan: SubscriptionPlan, index: number): string {
  return plan.id || plan._id || getPlanType(plan) || plan.name || plan.title || `plan-${index}`;
}

function getPlanDescription(plan?: SubscriptionPlan | null): string {
  return plan?.description || "";
}

function getPlanMonthlyPrice(plan: SubscriptionPlan): number | null {
  const v = plan.monthlyPrice ?? plan.price ?? plan.priceMonthly;
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function getCurrentStatus(sub?: CurrentSubscription | null): string {
  return String(sub?.subscriptionStatus || sub?.status || "NO ACTIVE PLAN");
}

function getCurrentMonthlyPrice(sub?: CurrentSubscription | null): number | null {
  if (sub?.monthlyPrice !== undefined && sub.monthlyPrice !== null) return sub.monthlyPrice;
  if (sub?.plan) return getPlanMonthlyPrice(sub.plan);
  return null;
}

/** Qolgan hajm — backend maydonini ustuvor oladi, bo'lmasa hisoblab chiqadi */
function getRemainingStorage(sub?: CurrentSubscription | null): number {
  const explicit = Number(sub?.remainingStorageBytes);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const total = Number(sub?.storageLimitBytes) || 0;
  const used = Number(sub?.currentStorageBytes) || 0;
  return Math.max(total - used, 0);
}

// ---------------------------------------------------------------------------
// Plan tier config
// ---------------------------------------------------------------------------
function getPlanConfig(planType: string | null | undefined, t: ReturnType<typeof useTranslations>) {
  const config: Record<string, { color: string; bg: string; ring: string; badge?: string }> = {
    START:      { color: "#6366f1", bg: "#eef2ff", ring: "#c7d2fe", badge: t("badges.start") },
    PRO:        { color: "#0ea5e9", bg: "#e0f2fe", ring: "#bae6fd", badge: t("badges.pro") },
    ENTERPRISE: { color: "#0A0F1E", bg: "#f1f5f9", ring: "#cbd5e1", badge: t("badges.enterprise") },
  };
  return config[planType || ""] || { color: "#64748b", bg: "#f8fafc", ring: "#e2e8f0" };
}

// ---------------------------------------------------------------------------
// Storage bar — segmentli, indigo/violet palitra
// ---------------------------------------------------------------------------
function StorageBar({
  usedBytes,
  totalBytes,
  remainingBytes,
}: {
  usedBytes: number;
  totalBytes: number;
  remainingBytes: number;
}) {
  const t = useTranslations("settings.plans");

  if (totalBytes <= 0) {
    return <p className="text-xs font-bold text-slate-400">{t("current.storageNoData")}</p>;
  }

  const rawPct = (usedBytes / totalBytes) * 100;

  // Rang holatlari — accent (normal) → amber (75%) → rose (90%)
  const tone =
    rawPct > 90
      ? { from: "#f43f5e", to: "#e11d48", track: "#ffe4e6", text: "#e11d48", soft: "#fff1f2" }
      : rawPct > 75
      ? { from: "#f59e0b", to: "#d97706", track: "#fef3c7", text: "#d97706", soft: "#fffbeb" }
      : {
          from: "var(--primary-blue)",
          to: "var(--primary-blue-dark)",
          track: "color-mix(in srgb, var(--primary-blue) 10%, white)",
          text: "var(--primary-blue)",
          soft: "color-mix(in srgb, var(--primary-blue) 8%, white)",
        };

  // 40 ta segment — har biri 2.5%
  const SEGMENTS = 40;
  const filledSegments = usedBytes > 0 ? Math.max(1, Math.round((rawPct / 100) * SEGMENTS)) : 0;

  const percentLabel =
    rawPct === 0
      ? "0"
      : rawPct < 0.1
      ? "0.1"
      : rawPct >= 10
      ? rawPct.toFixed(0)
      : rawPct.toFixed(1);

  return (
    <div>
      {/* Yuqori qator: katta foiz + umumiy hajm */}
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl font-black leading-none tracking-tight"
            style={{ color: tone.text }}
          >
            {percentLabel}
            <span className="text-lg">%</span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t("current.storageUsedShort")}
          </span>
        </div>

        <span
          className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-black"
          style={{ backgroundColor: tone.soft, color: tone.text }}
        >
          {t("current.storageTotal", { size: formatBytes(totalBytes) })}
        </span>
      </div>

      {/* Segmentli bar */}
      <div
        className="flex gap-[3px]"
        role="progressbar"
        aria-valuenow={Math.round(rawPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isFilled = i < filledSegments;
          return (
            <div
              key={i}
              className="h-2.5 flex-1 rounded-full transition-all duration-500"
              style={{
                background: isFilled
                  ? `linear-gradient(180deg, ${tone.from}, ${tone.to})`
                  : tone.track,
                transitionDelay: isFilled ? `${i * 12}ms` : "0ms",
              }}
            />
          );
        })}
      </div>

      {/* Pastki qator: ishlatilgan / qolgan */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: `linear-gradient(180deg, ${tone.from}, ${tone.to})` }}
          />
          <span className="text-sm font-black text-slate-800">{formatBytes(usedBytes)}</span>
          <span className="truncate text-[11px] font-medium text-slate-400">
            {t("current.storageUsedShort")}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: tone.track }}
          />
          <span className="text-sm font-black text-slate-800">
            {formatBytes(remainingBytes, rawPct < 1 ? 2 : 1)}
          </span>
          <span className="truncate text-[11px] font-medium text-slate-400">
            {t("current.storageFreeShort")}
          </span>
        </div>
      </div>

      {rawPct > 90 && (
        <div className="mt-3 rounded-xl px-3 py-2" style={{ backgroundColor: tone.soft }}>
          <span className="text-[11px] font-black" style={{ color: tone.text }}>
            {t("current.storageAlmostFull")}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Current plan card
// ---------------------------------------------------------------------------
function CurrentPlanCard({
  currentPlan,
  onChangePlan,
  onCancel,
  isCanceling,
}: {
  currentPlan: CurrentSubscription;
  onChangePlan: () => void;
  onCancel: () => void;
  isCanceling: boolean;
}) {
  const t = useTranslations("settings.plans");
  const planType = String(currentPlan.currentPlan || currentPlan.planType || "");
  const status = getCurrentStatus(currentPlan);
  const monthlyPrice = getCurrentMonthlyPrice(currentPlan);
  const isActive = status === "ACTIVE" || status === "TRIAL";

  // Storage — barcha maydonlar undefined bo'lishi mumkin
  const storageTotal = Number(currentPlan.storageLimitBytes) || 0;
  const storageUsed = Number(currentPlan.currentStorageBytes) || 0;
  const storageRemaining = getRemainingStorage(currentPlan);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Top accent bar */}
      <div className="h-1.5 w-full bg-primary-blue" />

      <div className="p-4 sm:p-7">
        {/* Plan header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-blue text-white sm:h-14 sm:w-14">
              <Zap size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                  {planType || "—"}
                </h2>
                <span className="rounded-full bg-primary-blue/10 px-2.5 py-0.5 text-xs font-black text-primary-blue">
                  {status}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {currentPlan.planDurationMonths
                  ? t("current.monthlyPlanLabel", { months: currentPlan.planDurationMonths })
                  : t("current.currentPlanFallback")}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="shrink-0 sm:text-right">
            <p className="text-2xl font-black leading-none text-slate-900 sm:text-3xl">
              {formatMoney(monthlyPrice)}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-400">{t("current.perMonth")}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-slate-100" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: <UserRound size={15} />,
              label: t("current.statDoctors"),
              value: limitLabel(currentPlan.maxDoctors),
            },
            {
              icon: <Users size={15} />,
              label: t("current.statStaff"),
              value: limitLabel(currentPlan.maxStaff),
            },
            {
              icon: <MessageCircle size={15} />,
              label: t("current.statSmsBalance"),
              value: String(currentPlan.smsBalance ?? 0),
            },
            {
              icon: <CalendarDays size={15} />,
              label: t("current.statExpiresAt"),
              value: formatDateTime(currentPlan.endDate || currentPlan.trialEndDate),
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                {item.icon}
                {item.label}
              </div>
              <p className="text-lg font-black leading-none text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Storage */}
        {storageTotal > 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-blue/10">
                <HardDrive size={14} className="text-primary-blue" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {t("current.storageLabel")}
              </span>
            </div>
            <StorageBar
              usedBytes={storageUsed}
              totalBytes={storageTotal}
              remainingBytes={storageRemaining}
            />
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onChangePlan}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-blue py-3 text-sm font-black text-white transition hover:bg-primary-blue-dark"
          >
            <Sparkles size={16} />
            {t("current.changePlanButton")}
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isCanceling || !isActive}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCanceling ? <DentalLoaderIcon size={16} /> : <ZapOff size={16} />}
            {t("current.cancelButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan card (available)
// ---------------------------------------------------------------------------
function PlanCard({
  plan,
  planKey,
  isCurrentPlan,
  durationMonths,
  onDurationChange,
  onActivate,
  isActivating,
}: {
  plan: SubscriptionPlan;
  planKey: string;
  isCurrentPlan: boolean;
  durationMonths: number;
  onDurationChange: (months: number) => void;
  onActivate: () => void;
  isActivating: boolean;
}) {
  const t = useTranslations("settings.plans");
  const planType = getPlanType(plan);
  const config = getPlanConfig(planType, t);
  const monthlyPrice = getPlanMonthlyPrice(plan);
  const isPopular = plan.recommended || planType === "PRO";

  const totalPrice = monthlyPrice !== null ? monthlyPrice * durationMonths : null;

  const durationOptions = getDurationOptions(t);

  const features = [
    {
      icon: <UserRound size={14} />,
      text: t("card.doctorsFeature", { count: limitLabel(plan.maxDoctors ?? plan.doctorLimit) }),
    },
    { icon: <Users size={14} />, text: t("card.staffFeature", { count: limitLabel(plan.maxStaff) }) },
    {
      icon: <HardDrive size={14} />,
      text: t("card.storageFeature", {
        count: bytesToGb(plan.storageLimitBytes) || plan.maxStorageGb || "∞",
      }),
    },
    {
      icon: <MessageCircle size={14} />,
      text: plan.includedSmsCount
        ? t("card.smsFeature", { count: plan.includedSmsCount })
        : t("card.smsSeparate"),
    },
    ...(plan.features || []).map((f) => ({ icon: <Check size={14} />, text: f })),
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl bg-white transition-all duration-200 hover:-translate-y-1",
        isPopular ? "shadow-xl" : "shadow-sm hover:shadow-lg"
      )}
      style={{
        border: `2px solid ${isPopular || isCurrentPlan ? config.color : "#e2e8f0"}`,
        boxShadow: isPopular ? `0 20px 40px -12px ${config.color}40` : undefined,
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-black text-white shadow-sm"
          style={{ backgroundColor: config.color }}
        >
          {config.badge || t("card.popularBadge")}
        </div>
      )}

      {/* Top bar */}
      <div className="h-1 w-full rounded-t-3xl" style={{ backgroundColor: config.color }} />

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span
              className="rounded-lg px-2.5 py-1 text-xs font-black"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              {config.badge || planType}
            </span>
            <h3 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">{planType}</h3>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: config.color }}
          >
            <Sparkles size={20} />
          </div>
        </div>

        {getPlanDescription(plan) ? (
          <p className="mt-2 text-sm text-slate-500">{getPlanDescription(plan)}</p>
        ) : null}

        {/* Price display */}
        <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: config.bg }}>
          <div className="flex items-end gap-1">
            <span
              className="text-3xl font-black leading-none sm:text-4xl"
              style={{ color: config.color }}
            >
              {formatMoney(monthlyPrice)}
            </span>
            <span className="mb-1 text-sm font-bold text-slate-500">{t("card.perMonth")}</span>
          </div>
          {totalPrice !== null && durationMonths > 1 && (
            <p className="mt-1 text-xs font-bold text-slate-500">
              {t("card.totalPrice", { total: formatMoney(totalPrice), months: durationMonths })}
            </p>
          )}
        </div>

        {/* Duration picker */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
            {t("card.durationLabel")}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {durationOptions.map((opt) => (
              <button
                key={opt.months}
                type="button"
                onClick={() => onDurationChange(opt.months)}
                className={cn(
                  "relative rounded-xl py-2 text-xs font-black transition",
                  durationMonths === opt.months
                    ? "text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
                style={durationMonths === opt.months ? { backgroundColor: config.color } : undefined}
              >
                {opt.label}
                {opt.badge && durationMonths !== opt.months && (
                  <span className="absolute -right-1 -top-1.5 rounded-full bg-emerald-500 px-1 text-[9px] font-black text-white">
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-5 space-y-2.5">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: config.color }}
              >
                {f.icon}
              </div>
              <span className="text-sm font-medium text-slate-700">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-6">
          {isCurrentPlan ? (
            <div
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Check size={16} />
              {t("card.currentPlanBadge")}
            </div>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              disabled={isActivating || totalPrice === null}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: config.color }}
            >
              {isActivating ? <DentalLoaderIcon size={16} /> : <CreditCard size={16} />}
              {t("card.payButton")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PlansPage() {
  const t = useTranslations("settings.plans");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({});

  const {
    data: currentPlan,
    isLoading: isCurrentLoading,
    refetch: refetchCurrent,
  } = useGetCurrentPlan();
  const { data: plans = [], isLoading: isPlansLoading, refetch: refetchPlans } = useGetPlans();

  const cancelMutation = useCancelPlan();
  const paymentMutation = useActivatePlanPayment();

  const sortedPlans = useMemo(() => {
    const order: Record<string, number> = { START: 1, PRO: 2, ENTERPRISE: 3 };
    return [...plans].sort(
      (a, b) => (order[getPlanType(a) || ""] || 99) - (order[getPlanType(b) || ""] || 99)
    );
  }, [plans]);

  function getDuration(planKey: string): number {
    return selectedDurations[planKey] || 1;
  }

  function handleActivatePlan(plan: SubscriptionPlan, planKey: string) {
    const planType = getPlanType(plan);
    if (!planType) {
      toast.error(t("toast.planTypeNotFound"));
      return;
    }

    const durationMonths = getDuration(planKey);
    const amountSom = getPlanMonthlyPrice(plan);
    if (!amountSom) {
      toast.error(t("toast.priceNotFound"));
      return;
    }

    /**
     * Payme tiyin da ishlaydi: 1 so'm = 100 tiyin
     * 500,000 so'm * 1 oy * 100 = 50,000,000 tiyin ✓
     */
    const amountTiyin = Math.round(amountSom * durationMonths * 100);
    const payload: CreatePaymentOrderDto = { planType, durationMonths, amountTiyin };

    paymentMutation.mutate(payload, {
      onSuccess: (url) => {
        window.location.href = url;
      },
      onError: (err) => {
        toast.error(err.message || t("toast.paymentFailed"));
      },
    });
  }

  async function handleCancelPlan() {
    const ok = await confirm({
      title: tCommon("actions.confirm"),
      message: t("toast.cancelConfirm"),
    });
    if (!ok) return;
    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("toast.planCancelled"));
        refetchCurrent();
      },
      onError: (err: any) => {
        toast.error(err?.message || t("toast.genericError"));
      },
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("page.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("page.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            refetchCurrent();
            refetchPlans();
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:w-fit"
        >
          <RefreshCcw
            size={15}
            className={isCurrentLoading || isPlansLoading ? "animate-spin" : ""}
          />
          {t("page.refresh")}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:w-fit">
        {[
          { key: "current" as TabType, label: t("tabs.current"), icon: <CreditCard size={15} /> },
          { key: "available" as TabType, label: t("tabs.available"), icon: <Sparkles size={15} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition sm:px-5",
              activeTab === tab.key
                ? "bg-primary-blue text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Current plan tab */}
      {activeTab === "current" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {isCurrentLoading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <DentalLoader fullScreen={false} />
            </div>
          ) : currentPlan ? (
            <CurrentPlanCard
              currentPlan={currentPlan}
              onChangePlan={() => setActiveTab("available")}
              onCancel={handleCancelPlan}
              isCanceling={cancelMutation.isPending}
            />
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
                <CreditCard size={28} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {t("empty.noActivePlanTitle")}
              </h2>
              <p className="mt-2 max-w-xs text-sm text-slate-500">
                {t("empty.noActivePlanSubtitle")}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                {t("empty.viewPlans")} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Billing sidebar */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                {t("sidebar.billingInfoTitle")}
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: t("sidebar.status"), value: getCurrentStatus(currentPlan) },
                  {
                    label: t("sidebar.planDuration"),
                    value: currentPlan?.planDurationMonths
                      ? t("sidebar.monthsValue", { months: currentPlan.planDurationMonths })
                      : "—",
                  },
                  { label: t("sidebar.startDate"), value: formatDateTime(currentPlan?.startDate) },
                  {
                    label: t("sidebar.endDate"),
                    value: formatDateTime(currentPlan?.endDate || currentPlan?.trialEndDate),
                  },
                  {
                    label: t("sidebar.includedSms"),
                    value: String(currentPlan?.includedSmsCount ?? 0),
                  },
                  {
                    label: t("sidebar.storageFree"),
                    value: formatBytes(getRemainingStorage(currentPlan)),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-xs font-bold text-slate-400">{item.label}</span>
                    <span className="text-sm font-black text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <p className="mb-1 text-xs font-black text-blue-700">
                {t("sidebar.paymeInfoTitle")}
              </p>
              <p className="text-xs leading-relaxed text-blue-600">{t("sidebar.paymeInfoText")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Available plans tab */}
      {activeTab === "available" && (
        <>
          {isPlansLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <DentalLoader fullScreen={false} />
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center sm:p-12">
              <h2 className="text-xl font-black text-slate-900">{t("empty.noPlansTitle")}</h2>
              <p className="mt-2 text-sm text-slate-500">{t("empty.noPlansSubtitle")}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">{t("helperText")}</p>
              <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedPlans.map((plan, index) => {
                  const planKey = getPlanKey(plan, index);
                  // "Joriy tarif" hech qachon ko'rsatilmaydi — foydalanuvchi
                  // har doim yangi tarif sotib olishi mumkin
                  const isCurrentPlan = false;
                  return (
                    <PlanCard
                      key={planKey}
                      plan={plan}
                      planKey={planKey}
                      isCurrentPlan={isCurrentPlan}
                      durationMonths={getDuration(planKey)}
                      onDurationChange={(months) =>
                        setSelectedDurations((prev) => ({ ...prev, [planKey]: months }))
                      }
                      onActivate={() => handleActivatePlan(plan, planKey)}
                      isActivating={paymentMutation.isPending}
                    />
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}