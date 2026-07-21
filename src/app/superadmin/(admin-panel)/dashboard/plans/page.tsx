"use client";

/**
 * File: src/app/superadmin/(dashboard)/dashboard/plans/page.tsx
 */

import { useState } from "react";
import { CheckCircle2, HardDrive, Loader2, MessageSquare, Rocket, Stethoscope, Users } from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";
import {
  usePlans,
  useTenants,
  useActivateSubscription,
} from "@/src/features/superadmin/subscriptions/UseSupscriptionAdmin";

function formatStorage(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

export default function PlansPage() {
  const toast = useToast();
  const { data: plans = [], isLoading, isError } = usePlans();
  const { data: tenantsData } = useTenants({ page: 0, limit: 100 });
  const activateMutation = useActivateSubscription();

  const tenants = tenantsData?.items || [];

  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");

  async function handleActivate() {
    if (!selectedTenant || !selectedPlan) {
      toast.error("Tenant va tarifni tanlang");
      return;
    }
    try {
      await activateMutation.mutateAsync({ tenantId: selectedTenant, planType: selectedPlan });
      toast.success("Obuna faollashtirildi");
    } catch {
      toast.error("Obunani faollashtirib bo'lmadi");
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border-color bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/10 via-violet-500/10 to-rose-400/10 blur-2xl" />

        <div className="relative mb-4 flex items-center gap-2">
          <Rocket size={18} className="text-violet-500" />
          <h2 className="text-base font-bold text-dark-navy">Obunani faollashtirish</h2>
        </div>

        <div className="relative flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Tenant
            </label>
            <select
              className="h-11 w-full rounded-xl border border-border-color bg-slate-50 px-3 font-mono text-xs outline-none"
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
            >
              <option value="">Tanlang...</option>
              {tenants.map((t) => (
                <option key={t.tenantId} value={t.tenantId}>
                  {t.tenantId} — {t.currentPlan} ({t.status})
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Tarif
            </label>
            <select
              className="h-11 w-full rounded-xl border border-border-color bg-slate-50 px-3 text-sm outline-none"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              <option value="">Tanlang...</option>
              {plans.map((p) => (
                <option key={p.planType} value={p.planType}>
                  {p.planType}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleActivate}
            disabled={activateMutation.isPending}
            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:opacity-90 disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            {activateMutation.isPending ? "Faollashtirilmoqda..." : "Faollashtirish"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border-color bg-white shadow-sm">
        <div className="border-b border-border-color px-6 py-4">
          <h2 className="text-base font-bold text-dark-navy">Barcha tariflar</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" size={22} />
          </div>
        ) : isError ? (
          <p className="px-6 py-10 text-center text-sm text-red-500">
            Tariflarni yuklab bo'lmadi.
          </p>
        ) : plans.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">Tariflar topilmadi.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.planType}
                className="flex flex-col rounded-2xl border border-border-color p-5 transition hover:border-transparent hover:shadow-lg hover:shadow-violet-100"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-500">
                    {p.planType}
                  </p>
                  {!p.active && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                      NOFAOL
                    </span>
                  )}
                </div>

                <p className="mt-2 bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 bg-clip-text text-2xl font-extrabold text-transparent">
                  {formatPrice(p.monthlyPrice)} so'm
                  <span className="text-sm font-semibold text-slate-400"> /{p.durationMonths} oy</span>
                </p>

                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={15} className="text-slate-400" />
                    Shifokorlar: <span className="font-bold text-dark-navy">
                      {p.maxDoctors > 100000 ? "cheksiz" : p.maxDoctors}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-slate-400" />
                    Xodimlar: <span className="font-bold text-dark-navy">
                      {p.maxStaff > 100000 ? "cheksiz" : p.maxStaff}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive size={15} className="text-slate-400" />
                    Xotira: <span className="font-bold text-dark-navy">{formatStorage(p.storageLimitBytes)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-slate-400" />
                    SMS: <span className="font-bold text-dark-navy">{p.includedSmsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}