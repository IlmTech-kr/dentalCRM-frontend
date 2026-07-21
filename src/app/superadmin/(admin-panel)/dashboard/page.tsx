"use client";

/**
 * File: src/app/superadmin/(dashboard)/dashboard/page.tsx
 */

import { useEffect, useState } from "react";
import { Ban, Info, Loader2, X } from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";
import {
  useTenants,
  useSuspendTenant,
  useTenantLimits,
  useUpdateTenantLimits,
} from "@/src/features/superadmin/subscriptions/UseSupscriptionAdmin";
import type { TenantStatus } from "@/src/features/superadmin/subscriptions/subscriptions-admin.service";
import { useClinic, useClinics } from "@/src/features/superadmin/clinics/UseClinicsAdmin";

const STATUS_OPTIONS: (TenantStatus | "ALL")[] = [
  "ALL",
  "ACTIVE",
  "TRIAL",
  "SUSPENDED",
  "EXPIRED",
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-200",
  TRIAL: "bg-sky-50 text-sky-600 border-sky-200",
  SUSPENDED: "bg-red-50 text-red-600 border-red-200",
  EXPIRED: "bg-slate-100 text-slate-500 border-slate-200",
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "0 GB";
  const gb = bytes / 1024 ** 3;
  return `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`;
}

export default function TenantsPage() {
  const toast = useToast();
  const [status, setStatus] = useState<TenantStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [limitsTenantId, setLimitsTenantId] = useState<string | null>(null);
  const [detailsTenantId, setDetailsTenantId] = useState<string | null>(null);

  const { data, isLoading, isError } = useTenants({
    status: status === "ALL" ? undefined : status,
    page,
    limit,
  });
  const suspendMutation = useSuspendTenant();

  // Klinika nomi/subdomain subscriptions endpointida yo'q — shuning uchun
  // klinikalar ro'yxati alohida so'raladi va tenantId bo'yicha moslashtiriladi.
  const { data: clinicsData } = useClinics({ page: 0, limit: 200 });
  const clinicByTenantId = new Map(
    (clinicsData?.items || []).map((c) => [c.tenantId || c.id, c])
  );

  const tenants = data?.items || [];
  const totalPages = data?.totalPages ?? null;
  const totalElements = data?.totalElements ?? tenants.length;

  async function handleSuspend(tenantId: string, label: string) {
    if (!confirm(`"${label}" ni to'xtatib qo'yasizmi?`)) return;
    try {
      await suspendMutation.mutateAsync(tenantId);
      toast.success("Tenant to'xtatildi");
    } catch {
      toast.error("Amalni bajarib bo'lmadi");
    }
  }

  return (
    <div className="rounded-3xl border border-border-color bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-color px-6 py-4">
        <p className="text-sm text-text-light">
          Jami: <span className="font-bold text-dark-navy">{totalElements}</span> ta tenant
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                status === s
                  ? "bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : isError ? (
        <p className="px-6 py-10 text-center text-sm text-red-500">
          Tenantlarni yuklab bo'lmadi.
        </p>
      ) : tenants.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">Tenantlar topilmadi.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-color text-xs uppercase text-slate-400">
              <th className="px-6 py-3 font-semibold">Klinika</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Tarif</th>
              <th className="px-6 py-3 font-semibold">Amal qiladi</th>
              <th className="px-6 py-3 font-semibold">SMS</th>
              <th className="px-6 py-3 font-semibold">Xotira</th>
              <th className="px-6 py-3 font-semibold text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const id = t.tenantId;
              const clinic = clinicByTenantId.get(id);

              return (
                <tr key={id} className="border-b border-border-color last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-dark-navy">{clinic?.name || "—"}</p>
                    <p className="font-mono text-xs text-slate-400">
                      {clinic?.subDomain ? `${clinic.subDomain} · ` : ""}
                      {id}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                        STATUS_STYLES[t.status] || "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{t.currentPlan}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(t.startDate)} → {formatDate(t.endDate)}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{t.smsBalance}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatBytes(t.currentStorageBytes)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setDetailsTenantId(id)}
                        className="flex items-center gap-1 rounded-lg border border-border-color px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Info size={13} />
                        Batafsil
                      </button>
                      <button
                        onClick={() => setLimitsTenantId(id)}
                        className="rounded-lg border border-border-color px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        Limitlar
                      </button>
                      <button
                        onClick={() => handleSuspend(id, clinic?.name || id)}
                        disabled={suspendMutation.isPending || t.status === "SUSPENDED"}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Ban size={13} />
                        To'xtatish
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {totalPages !== null && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-border-color px-6 py-4">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-border-color px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
          >
            Oldingi
          </button>
          <span className="text-xs text-slate-400">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border-color px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
          >
            Keyingi
          </button>
        </div>
      )}

      {limitsTenantId && (
        <TenantLimitsModal tenantId={limitsTenantId} onClose={() => setLimitsTenantId(null)} />
      )}

      {detailsTenantId && (
        <ClinicDetailModal tenantId={detailsTenantId} onClose={() => setDetailsTenantId(null)} />
      )}
    </div>
  );
}

function ClinicDetailModal({
  tenantId,
  onClose,
}: {
  tenantId: string;
  onClose: () => void;
}) {
  const { data: clinic, isLoading, isError } = useClinic(tenantId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-dark-navy">Klinika ma'lumotlari</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={20} />
          </div>
        ) : isError || !clinic ? (
          <p className="py-6 text-center text-sm text-red-500">
            Klinika ma'lumotlarini yuklab bo'lmadi.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {Object.entries(clinic).map(([key, value]) => {
              if (value === null || value === undefined || typeof value === "object") return null;
              return (
                <div key={key} className="flex items-center justify-between border-b border-border-color/60 py-1.5">
                  <span className="text-xs font-bold uppercase text-slate-400">{key}</span>
                  <span className="font-semibold text-dark-navy">{String(value)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-border-color px-4 py-2 text-sm font-bold text-slate-600"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

function TenantLimitsModal({
  tenantId,
  onClose,
}: {
  tenantId: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const { data, isLoading } = useTenantLimits(tenantId);
  const updateMutation = useUpdateTenantLimits();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const initial: Record<string, string> = {};
      Object.entries(data).forEach(([k, v]) => {
        if (typeof v === "number" || typeof v === "string") {
          initial[k] = String(v);
        }
      });
      setForm(initial);
    }
  }, [data]);

  async function handleSave() {
    const payload: Record<string, unknown> = {};
    Object.entries(form).forEach(([k, v]) => {
      const num = Number(v);
      payload[k] = Number.isFinite(num) && v.trim() !== "" ? num : v;
    });

    try {
      await updateMutation.mutateAsync({ tenantId, payload });
      toast.success("Limitlar yangilandi");
      onClose();
    } catch {
      toast.error("Limitlarni saqlab bo'lmadi");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-dark-navy">Tenant limitlari</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={20} />
          </div>
        ) : (
          <div className="space-y-3">
            {Object.keys(form).length === 0 ? (
              <p className="text-sm text-slate-400">Limit maydonlari topilmadi.</p>
            ) : (
              Object.entries(form).map(([key, value]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                    {key}
                  </label>
                  <input
                    className="h-11 w-full rounded-xl border border-border-color bg-slate-50 px-3 text-sm outline-none focus:border-primary-blue"
                    value={value}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border-color px-4 py-2 text-sm font-bold text-slate-600"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            className="rounded-xl bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}