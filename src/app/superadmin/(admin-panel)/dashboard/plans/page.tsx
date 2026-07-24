"use client";

/**
 * File:
 * src/app/superadmin/(dashboard)/dashboard/plans/page.tsx
 */

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  HardDrive,
  Loader2,
  MessageSquare,
  Pencil,
  Rocket,
  Save,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";

import {
  useActivateSubscription,
  usePlans,
  useTenants,
  useUpdatePlan,
} from "@/src/features/superadmin/subscriptions/UseSupscriptionAdmin";

import type {
  SubscriptionPlan,
} from "@/src/features/superadmin/subscriptions/subscriptions-admin.service";

/* =====================================================
 * HELPERS
 * ===================================================== */

function formatStorage(
  bytes: number
): string {
  if (!bytes) {
    return "0 GB";
  }

  const gb =
    bytes /
    1024 ** 3;

  return `${
    Number.isInteger(gb)
      ? gb
      : gb.toFixed(1)
  } GB`;
}

function formatPrice(
  value: number
): string {
  return new Intl.NumberFormat(
    "uz-UZ"
  ).format(value);
}

/* =====================================================
 * PAGE
 * ===================================================== */

export default function PlansPage() {
  const toast = useToast();

  const {
    data: plans = [],
    isLoading,
    isError,
  } = usePlans();

  const {
    data: tenantsData,
  } = useTenants({
    page: 0,
    limit: 100,
  });

  const activateMutation =
    useActivateSubscription();

  const [
    selectedTenant,
    setSelectedTenant,
  ] = useState("");

  const [
    selectedPlan,
    setSelectedPlan,
  ] = useState("");

  const [
    editingPlan,
    setEditingPlan,
  ] =
    useState<SubscriptionPlan | null>(
      null
    );

  const tenants =
    tenantsData?.items ?? [];

  async function handleActivate() {
    if (
      !selectedTenant ||
      !selectedPlan
    ) {
      toast.error(
        "Tenant va tarifni tanlang"
      );

      return;
    }

    try {
      await activateMutation.mutateAsync({
        tenantId: selectedTenant,
        planType: selectedPlan,
      });

      toast.success(
        "Obuna faollashtirildi"
      );

      setSelectedTenant("");
      setSelectedPlan("");
    } catch {
      toast.error(
        "Obunani faollashtirib bo‘lmadi"
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscription activate */}

      <div className="relative overflow-hidden rounded-3xl border border-border-color bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/10 via-violet-500/10 to-rose-400/10 blur-2xl" />

        <div className="relative mb-4 flex items-center gap-2">
          <Rocket
            size={18}
            className="text-violet-500"
          />

          <h2 className="text-base font-bold text-dark-navy">
            Obunani faollashtirish
          </h2>
        </div>

        <div className="relative flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Tenant
            </label>

            <select
              value={selectedTenant}
              onChange={(event) =>
                setSelectedTenant(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-border-color bg-slate-50 px-3 font-mono text-xs outline-none"
            >
              <option value="">
                Tanlang...
              </option>

              {tenants.map(
                (tenant) => (
                  <option
                    key={
                      tenant.tenantId
                    }
                    value={
                      tenant.tenantId
                    }
                  >
                    {tenant.tenantId}
                    {" — "}
                    {tenant.currentPlan}
                    {" ("}
                    {tenant.status}
                    {")"}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Tarif
            </label>

            <select
              value={selectedPlan}
              onChange={(event) =>
                setSelectedPlan(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-border-color bg-slate-50 px-3 text-sm outline-none"
            >
              <option value="">
                Tanlang...
              </option>

              {plans
                .filter(
                  (plan) =>
                    plan.active
                )
                .map((plan) => (
                  <option
                    key={
                      plan.planType
                    }
                    value={
                      plan.planType
                    }
                  >
                    {plan.planType}
                  </option>
                ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleActivate()
            }
            disabled={
              activateMutation.isPending
            }
            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activateMutation.isPending ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <CheckCircle2
                size={16}
              />
            )}

            {activateMutation.isPending
              ? "Faollashtirilmoqda..."
              : "Faollashtirish"}
          </button>
        </div>
      </div>

      {/* Plans list */}

      <div className="rounded-3xl border border-border-color bg-white shadow-sm">
        <div className="border-b border-border-color px-6 py-4">
          <h2 className="text-base font-bold text-dark-navy">
            Barcha tariflar
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="animate-spin text-slate-400"
              size={22}
            />
          </div>
        ) : isError ? (
          <p className="px-6 py-10 text-center text-sm text-red-500">
            Tariflarni yuklab
            bo‘lmadi.
          </p>
        ) : plans.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            Tariflar topilmadi.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map(
              (plan) => (
                <div
                  key={
                    plan.planType
                  }
                  className="flex flex-col rounded-2xl border border-border-color p-5 transition hover:border-transparent hover:shadow-lg hover:shadow-violet-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-violet-500">
                        {plan.planType}
                      </p>

                      {!plan.active && (
                        <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                          NOFAOL
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingPlan(
                          plan
                        )
                      }
                      className="flex items-center gap-1 rounded-lg border border-border-color px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Pencil
                        size={13}
                      />

                      Narxni o‘zgartirish
                    </button>
                  </div>

                  <p className="mt-3 bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 bg-clip-text text-2xl font-extrabold text-transparent">
                    {formatPrice(
                      plan.monthlyPrice
                    )}{" "}
                    so‘m

                    <span className="text-sm font-semibold text-slate-400">
                      {" "}
                      /{" "}
                      {
                        plan.durationMonths
                      }{" "}
                      oy
                    </span>
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Stethoscope
                        size={15}
                        className="text-slate-400"
                      />

                      Shifokorlar:

                      <span className="font-bold text-dark-navy">
                        {plan.maxDoctors >
                        100000
                          ? "cheksiz"
                          : plan.maxDoctors}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users
                        size={15}
                        className="text-slate-400"
                      />

                      Xodimlar:

                      <span className="font-bold text-dark-navy">
                        {plan.maxStaff >
                        100000
                          ? "cheksiz"
                          : plan.maxStaff}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <HardDrive
                        size={15}
                        className="text-slate-400"
                      />

                      Xotira:

                      <span className="font-bold text-dark-navy">
                        {formatStorage(
                          plan.storageLimitBytes
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MessageSquare
                        size={15}
                        className="text-slate-400"
                      />

                      SMS:

                      <span className="font-bold text-dark-navy">
                        {
                          plan.includedSmsCount
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {editingPlan && (
        <EditPlanPriceModal
          plan={editingPlan}
          onClose={() =>
            setEditingPlan(null)
          }
        />
      )}
    </div>
  );
}

/* =====================================================
 * EDIT PRICE MODAL
 * ===================================================== */

function EditPlanPriceModal({
  plan,
  onClose,
}: {
  plan: SubscriptionPlan;
  onClose: () => void;
}) {
  const toast = useToast();

  const updateMutation =
    useUpdatePlan();

  const [
    monthlyPrice,
    setMonthlyPrice,
  ] = useState(
    String(plan.monthlyPrice)
  );

  useEffect(() => {
    setMonthlyPrice(
      String(plan.monthlyPrice)
    );
  }, [plan]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [onClose]);

  async function handleSave() {
    const normalizedValue =
      monthlyPrice
        .replace(/\s/g, "")
        .replace(/,/g, "");

    const price =
      Number(normalizedValue);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast.error(
        "Narx noto‘g‘ri kiritildi"
      );

      return;
    }

    if (
      price ===
      plan.monthlyPrice
    ) {
      toast.error(
        "Narx o‘zgartirilmagan"
      );

      return;
    }

    try {
      await updateMutation.mutateAsync({
        planType:
          plan.planType,

        payload: {
          monthlyPrice: price,
        },
      });

      toast.success(
        `${plan.planType} tarifi narxi yangilandi`
      );

      onClose();
    } catch {
      toast.error(
        "Tarif narxini yangilab bo‘lmadi"
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-border-color px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-dark-navy">
              Tarif narxini
              o‘zgartirish
            </h2>

            <p className="mt-1 text-sm font-bold text-violet-500">
              {plan.planType}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}

        <div className="p-6">
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-400">
              Hozirgi narx
            </p>

            <p className="mt-1 text-lg font-bold text-dark-navy">
              {formatPrice(
                plan.monthlyPrice
              )}{" "}
              so‘m
            </p>
          </div>

          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Yangi oylik narx
          </label>

          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              autoFocus
              value={monthlyPrice}
              onChange={(event) =>
                setMonthlyPrice(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void handleSave();
                }
              }}
              className="h-12 w-full rounded-xl border border-border-color bg-slate-50 px-4 pr-20 text-base font-semibold text-dark-navy outline-none transition focus:border-violet-400 focus:bg-white"
            />

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              so‘m
            </span>
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end gap-2 border-t border-border-color px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border-color px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Bekor qilish
          </button>

          <button
            type="button"
            disabled={
              updateMutation.isPending
            }
            onClick={() =>
              void handleSave()
            }
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <Loader2
                className="animate-spin"
                size={16}
              />
            ) : (
              <Save size={16} />
            )}

            {updateMutation.isPending
              ? "Saqlanmoqda..."
              : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}