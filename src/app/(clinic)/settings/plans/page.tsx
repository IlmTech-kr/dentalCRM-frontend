"use client";

/**
 * File: src/app/(clinic)/settings/plans/page.tsx
 */

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  HardDrive,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Sparkles,
  UserRound,
  Users,
  Zap,
  ZapOff,
} from "lucide-react";

import {
  useCancelPlan,
  useGetCurrentPlan,
  useGetPlans,
} from "@/src/features/subscriptions/hooks/useSubscription";
import { useToast } from "@/src/lib/hooks/Usetoast";

import type {
  CurrentSubscription,
  PlanType,
  SubscriptionPlan,
} from "@/src/types/subscription.types";
import type { CreatePaymentOrderDto } from "@/src/types/payment.types";
import { useActivatePlanPayment } from "@/src/features/payment/hooks/hooks";

type TabType = "current" | "available";

const DURATION_OPTIONS = [
  { months: 1, label: "1 oy" },
  { months: 3, label: "3 oy" },
  { months: 6, label: "6 oy" },
  { months: 12, label: "1 yil", badge: "−17%" },
];

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

function bytesToGb(bytes?: number | null): number {
  if (!bytes) return 0;
  return Math.round((bytes / (1024 ** 3)) * 10) / 10;
}

function limitLabel(value?: number | null): string {
  if (value === null || value === undefined || value >= INT_MAX) return "∞";
  return String(value);
}

function getPlanType(plan?: SubscriptionPlan | null): PlanType | null {
  const raw = String(plan?.planType || plan?.type || plan?.name || plan?.title || "").trim().toUpperCase();
  if (raw.includes("START")) return "START";
  if (raw.includes("PRO")) return "PRO";
  if (raw.includes("ENTERPRISE")) return "ENTERPRISE";
  return null;
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

// ---------------------------------------------------------------------------
// Plan tier config
// ---------------------------------------------------------------------------
const PLAN_CONFIG: Record<string, { color: string; bg: string; ring: string; badge?: string }> = {
  START:      { color: "#6366f1", bg: "#eef2ff", ring: "#c7d2fe", badge: "Boshlang'ich" },
  PRO:        { color: "#0ea5e9", bg: "#e0f2fe", ring: "#bae6fd", badge: "Mashhur" },
  ENTERPRISE: { color: "#0A0F1E", bg: "#f1f5f9", ring: "#cbd5e1", badge: "Korporativ" },
};

function getPlanConfig(planType?: string | null) {
  return PLAN_CONFIG[planType || ""] || { color: "#64748b", bg: "#f8fafc", ring: "#e2e8f0" };
}

// ---------------------------------------------------------------------------
// Storage bar
// ---------------------------------------------------------------------------
function StorageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct > 85 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#10b981";
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
        <span>{used} GB ishlatilgan</span>
        <span>{total} GB</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
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
  const planType = String(currentPlan.currentPlan || currentPlan.planType || "");
  const config = getPlanConfig(planType);
  const status = getCurrentStatus(currentPlan);
  const monthlyPrice = getCurrentMonthlyPrice(currentPlan);
  const storageLimitGb = bytesToGb(currentPlan.storageLimitBytes);
  const storageUsedGb = bytesToGb(currentPlan.currentStorageBytes);
  const isActive = status === "ACTIVE" || status === "TRIAL";

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: config.color }} />

      <div className="p-7">
        {/* Plan header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: config.color }}
            >
              <Zap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">{planType || "—"}</h2>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-black"
                  style={{ backgroundColor: config.bg, color: config.color }}
                >
                  {status}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {currentPlan.planDurationMonths ? `${currentPlan.planDurationMonths} oylik tarif` : "Joriy tarif"}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-slate-900 leading-none">
              {formatMoney(monthlyPrice)}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-400">so'm / oy</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-slate-100" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: <UserRound size={15} />, label: "Shifokorlar", value: limitLabel(currentPlan.maxDoctors) },
            { icon: <Users size={15} />, label: "Xodimlar", value: limitLabel(currentPlan.maxStaff) },
            { icon: <MessageCircle size={15} />, label: "SMS balans", value: String(currentPlan.smsBalance ?? 0) },
            { icon: <CalendarDays size={15} />, label: "Muddat tugaydi", value: formatDateTime(currentPlan.endDate || currentPlan.trialEndDate) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1.5">
                {item.icon}
                {item.label}
              </div>
              <p className="text-lg font-black text-slate-900 leading-none">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Storage */}
        {currentPlan.storageLimitBytes ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-3">
              <HardDrive size={15} />
              Saqlash joyi
            </div>
            <StorageBar used={storageUsedGb} total={storageLimitGb} />
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onChangePlan}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white transition hover:opacity-90"
            style={{ backgroundColor: config.color }}
          >
            <Sparkles size={16} />
            Tarifni o'zgartirish
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isCanceling || !isActive}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCanceling ? <Loader2 size={16} className="animate-spin" /> : <ZapOff size={16} />}
            Bekor qilish
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
  const planType = getPlanType(plan);
  const config = getPlanConfig(planType);
  const monthlyPrice = getPlanMonthlyPrice(plan);
  const isPopular = plan.recommended || planType === "PRO";

  const totalPrice = monthlyPrice !== null ? monthlyPrice * durationMonths : null;

  const features = [
    { icon: <UserRound size={14} />, text: `${limitLabel(plan.maxDoctors ?? plan.doctorLimit)} shifokor` },
    { icon: <Users size={14} />, text: `${limitLabel(plan.maxStaff)} xodim` },
    { icon: <HardDrive size={14} />, text: `${bytesToGb(plan.storageLimitBytes) || plan.maxStorageGb || "∞"} GB saqlash` },
    { icon: <MessageCircle size={14} />, text: plan.includedSmsCount ? `${plan.includedSmsCount} ta SMS` : "SMS: alohida" },
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
        boxShadow: isPopular
          ? `0 20px 40px -12px ${config.color}40`
          : undefined,
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-black text-white shadow-sm"
          style={{ backgroundColor: config.color }}
        >
          {config.badge || "Mashhur"}
        </div>
      )}

      {/* Top bar */}
      <div className="h-1 w-full rounded-t-3xl" style={{ backgroundColor: config.color }} />

      <div className="flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span
              className="rounded-lg px-2.5 py-1 text-xs font-black"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              {config.badge || planType}
            </span>
            <h3 className="mt-2 text-2xl font-black text-slate-900">{planType}</h3>
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
            <span className="text-4xl font-black leading-none" style={{ color: config.color }}>
              {formatMoney(monthlyPrice)}
            </span>
            <span className="mb-1 text-sm font-bold text-slate-500">so'm/oy</span>
          </div>
          {totalPrice !== null && durationMonths > 1 && (
            <p className="mt-1 text-xs font-bold text-slate-500">
              Jami: {formatMoney(totalPrice)} so'm / {durationMonths} oy
            </p>
          )}
        </div>

        {/* Duration picker */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Muddat</p>
          <div className="grid grid-cols-4 gap-1.5">
            {DURATION_OPTIONS.map((opt) => (
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
                style={durationMonths === opt.months ? { backgroundColor: config.color } : {}}
              >
                {opt.label}
                {opt.badge && durationMonths !== opt.months && (
                  <span className="absolute -top-1.5 -right-1 rounded-full bg-emerald-500 px-1 text-[9px] font-black text-white">
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
              Joriy tarif
            </div>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              disabled={isActivating || totalPrice === null}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: config.color }}
            >
              {isActivating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CreditCard size={16} />
              )}
              Payme orqali to'lash
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
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({});

  const { data: currentPlan, isLoading: isCurrentLoading, refetch: refetchCurrent } = useGetCurrentPlan();
  const { data: plans = [], isLoading: isPlansLoading, refetch: refetchPlans } = useGetPlans();

  const cancelMutation = useCancelPlan();
  const paymentMutation = useActivatePlanPayment();

  const currentPlanType = String(currentPlan?.currentPlan || currentPlan?.planType || "");

  const sortedPlans = useMemo(() => {
    const order: Record<string, number> = { START: 1, PRO: 2, ENTERPRISE: 3 };
    return [...plans].sort((a, b) => (order[getPlanType(a) || ""] || 99) - (order[getPlanType(b) || ""] || 99));
  }, [plans]);

  function getDuration(planKey: string): number {
    return selectedDurations[planKey] || 1;
  }

  function handleActivatePlan(plan: SubscriptionPlan, planKey: string) {
    const planType = getPlanType(plan);
    if (!planType) { toast.error("Plan type topilmadi"); return; }

    const durationMonths = getDuration(planKey);
    const amountSom = getPlanMonthlyPrice(plan);
    if (!amountSom) { toast.error("Bu tarif uchun narx topilmadi."); return; }

    /**
     * Payme tiyin da ishlaydi: 1 so'm = 100 tiyin
     * 500,000 so'm * 1 oy * 100 = 50,000,000 tiyin ✓ (Payme response da price: 50000000)
     */
    const amountTiyin = Math.round(amountSom * durationMonths * 100);
    const payload: CreatePaymentOrderDto = { planType, durationMonths, amountTiyin };

    paymentMutation.mutate(payload, {
      onSuccess: (url) => { window.location.href = url; },
      onError: (err) => { toast.error(err.message || "To'lovda xatolik bo'ldi"); },
    });
  }

  function handleCancelPlan() {
    if (!window.confirm("Haqiqatan ham joriy tarifni bekor qilmoqchimisiz?")) return;
    cancelMutation.mutate(undefined, {
      onSuccess: () => { toast.success("Tarif bekor qilindi"); refetchCurrent(); },
      onError: (err: any) => { toast.error(err?.message || "Xatolik yuz berdi"); },
    });
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tarif va to'lovlar</h1>
          <p className="mt-1 text-sm text-slate-500">Klinikangiz tarifini boshqaring</p>
        </div>
        <button
          type="button"
          onClick={() => { refetchCurrent(); refetchPlans(); }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCcw size={15} className={isCurrentLoading || isPlansLoading ? "animate-spin" : ""} />
          Yangilash
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {[
          { key: "current" as TabType, label: "Joriy tarif", icon: <CreditCard size={15} /> },
          { key: "available" as TabType, label: "Barcha tariflar", icon: <Sparkles size={15} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition",
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
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
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
              <h2 className="text-xl font-black text-slate-900">Aktiv tarif yo'q</h2>
              <p className="mt-2 max-w-xs text-sm text-slate-500">Tariflardan birini tanlab klinikangizni to'liq imkoniyatlar bilan ishga tushiring.</p>
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Tariflarni ko'rish <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Billing sidebar */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">To'lov ma'lumoti</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Status", value: getCurrentStatus(currentPlan) },
                  { label: "Plan davomiyligi", value: currentPlan?.planDurationMonths ? `${currentPlan.planDurationMonths} oy` : "—" },
                  { label: "Boshlanish sanasi", value: formatDateTime(currentPlan?.startDate) },
                  { label: "Tugash sanasi", value: formatDateTime(currentPlan?.endDate || currentPlan?.trialEndDate) },
                  { label: "SMS kiruvchi", value: String(currentPlan?.includedSmsCount ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <span className="text-xs font-bold text-slate-400">{item.label}</span>
                    <span className="text-sm font-black text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-black text-blue-700 mb-1">💳 Payme orqali to'lov</p>
              <p className="text-xs text-blue-600 leading-relaxed">Tarif aktivlashtirilganda Payme checkout sahifasiga yo'naltirilasiz. To'lov xavfsiz va tezkor.</p>
            </div>
          </div>
        </div>
      )}

      {/* Available plans tab */}
      {activeTab === "available" && (
        <>
          {isPlansLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <h2 className="text-xl font-black text-slate-900">Tariflar topilmadi</h2>
              <p className="mt-2 text-sm text-slate-500">Backenddan tariflar ro'yxati kelmadi.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Tarifni tanlang va muddat belgilang — jami summa avtomatik hisoblanadi.
              </p>
              <div className="grid gap-6 lg:grid-cols-3 mt-2">
                {sortedPlans.map((plan, index) => {
                  const planKey = getPlanKey(plan, index);
                  const planType = getPlanType(plan);
                  // "Joriy tarif" hech qachon ko'rsatilmaydi — foydalanuvchi har doim yangi tarif sotib olishi mumkin
                  const isCurrentPlan = false;
                  return (
                    <PlanCard
                      key={planKey}
                      plan={plan}
                      planKey={planKey}
                      isCurrentPlan={isCurrentPlan}
                      durationMonths={getDuration(planKey)}
                      onDurationChange={(months) => setSelectedDurations((prev) => ({ ...prev, [planKey]: months }))}
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