"use client";

/**
 * File:
 * src/app/superadmin/(dashboard)/dashboard/page.tsx
 */

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  Ban,
  Info,
  Loader2,
  X,
} from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";

import {
  useSuspendTenant,
  useTenantLimits,
  useTenants,
  useUpdateTenantLimits,
} from "@/src/features/superadmin/subscriptions/UseSupscriptionAdmin";

import type {
  TenantStatus,
  TenantSubscription,
} from "@/src/features/superadmin/subscriptions/subscriptions-admin.service";

import { useClinics } from "@/src/features/superadmin/clinics/UseClinicsAdmin";

import type {
  ClinicSummary,
} from "@/src/features/superadmin/clinics/clinics.admin.service";

/* =====================================================
 * TYPES
 * ===================================================== */

type StatusFilter =
  | TenantStatus
  | "ALL";

interface ClinicsResponseShape {
  items?: ClinicSummary[];
  clinics?: ClinicSummary[];
}

type DetailData = Record<
  string,
  unknown
>;

/* =====================================================
 * CONSTANTS
 * ===================================================== */

const STATUS_OPTIONS: StatusFilter[] = [
  "ALL",
  "ACTIVE",
  "TRIAL",
  "SUSPENDED",
  "EXPIRED",
];

const STATUS_STYLES: Record<
  string,
  string
> = {
  ACTIVE:
    "border-emerald-200 bg-emerald-50 text-emerald-600",

  TRIAL:
    "border-sky-200 bg-sky-50 text-sky-600",

  SUSPENDED:
    "border-red-200 bg-red-50 text-red-600",

  EXPIRED:
    "border-slate-200 bg-slate-100 text-slate-500",

  CANCELED:
    "border-orange-200 bg-orange-50 text-orange-600",
};

const HIDDEN_CLINIC_FIELDS = [
  "id",
  "tenantId",
];

const HIDDEN_SUBSCRIPTION_FIELDS = [
  "tenantId",
];

const READ_ONLY_LIMIT_FIELDS =
  new Set([
    "id",
    "tenantId",
    "createdAt",
    "updatedAt",
  ]);

/* =====================================================
 * HELPERS
 * ===================================================== */

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "uz-UZ",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function formatDateTime(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(
    "uz-UZ",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatBytes(
  bytes?: number | null
): string {
  if (
    bytes === null ||
    bytes === undefined ||
    bytes <= 0
  ) {
    return "0 GB";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const index = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    ),
    units.length - 1
  );

  const value =
    bytes /
    1024 ** index;

  return `${value.toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}

function getStatusStyle(
  status?: string | null
): string {
  if (!status) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  return (
    STATUS_STYLES[status] ??
    "border-slate-200 bg-slate-50 text-slate-500"
  );
}

function formatFieldLabel(
  key: string,
  t: ReturnType<typeof useTranslations>
): string {
  const labelKey = `dashboard.fieldLabels.${key}`;

  if (t.has(labelKey)) {
    return t(labelKey);
  }

  return key
    .replace(
      /([a-z0-9])([A-Z])/g,
      "$1 $2"
    )
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatFieldValue(
  key: string,
  value: unknown,
  t: ReturnType<typeof useTranslations>
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (
    typeof value === "number" &&
    key
      .toLowerCase()
      .includes("bytes")
  ) {
    return formatBytes(value);
  }

  if (
    typeof value === "string" &&
    /(date|at|time)$/i.test(key)
  ) {
    return formatDateTime(value);
  }

  if (
    typeof value === "boolean"
  ) {
    return value
      ? t("dashboard.booleanYes")
      : t("dashboard.booleanNo");
  }

  if (
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(
        value,
        null,
        2
      );
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function normalizeClinics(
  response: unknown
): ClinicSummary[] {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response as ClinicSummary[];
  }

  if (
    typeof response !== "object"
  ) {
    return [];
  }

  const result =
    response as ClinicsResponseShape;

  if (Array.isArray(result.items)) {
    return result.items;
  }

  if (
    Array.isArray(result.clinics)
  ) {
    return result.clinics;
  }

  return [];
}

/* =====================================================
 * PAGE
 * ===================================================== */

export default function DashboardPage() {
  const t = useTranslations("superadmin");
  const toast = useToast();

  const [status, setStatus] =
    useState<StatusFilter>(
      "ALL"
    );

  const [page, setPage] =
    useState(0);

  const [limit] =
    useState(10);

  const [
    detailsTenantId,
    setDetailsTenantId,
  ] = useState<string | null>(
    null
  );

  const [
    limitsTenantId,
    setLimitsTenantId,
  ] = useState<string | null>(
    null
  );

  /*
   * Subscription tenantlari.
   */
  const {
    data: tenantsData,
    isLoading:
      isTenantsLoading,
    isError:
      isTenantsError,
  } = useTenants({
    status:
      status === "ALL"
        ? undefined
        : status,

    page,
    limit,
  });

  /*
   * Klinika nomi va subdomain.
   *
   * Bu ro‘yxatdan olinadi.
   * Clinic by ID endpointi chaqirilmaydi.
   */
  const {
    data: clinicsResponse,
    isLoading:
      isClinicsLoading,
    isError:
      isClinicsError,
  } = useClinics({
    page: 0,
    limit: 500,
  });

  const suspendMutation =
    useSuspendTenant();

  const tenants =
    useMemo<
      TenantSubscription[]
    >(
      () =>
        tenantsData?.items ??
        [],
      [tenantsData]
    );

  const clinics =
    useMemo(
      () =>
        normalizeClinics(
          clinicsResponse
        ),
      [clinicsResponse]
    );

  /*
   * Clinic lookup:
   *
   * clinic.tenantId orqali
   * va ehtiyot uchun clinic.id orqali.
   */
  const clinicByTenantId =
    useMemo(() => {
      const map =
        new Map<
          string,
          ClinicSummary
        >();

      clinics.forEach(
        (clinic) => {
          if (clinic.tenantId) {
            map.set(
              clinic.tenantId,
              clinic
            );
          }

          if (clinic.id) {
            map.set(
              clinic.id,
              clinic
            );
          }
        }
      );

      return map;
    }, [clinics]);

  const selectedClinic =
    useMemo(() => {
      if (!detailsTenantId) {
        return null;
      }

      return (
        clinicByTenantId.get(
          detailsTenantId
        ) ?? null
      );
    }, [
      detailsTenantId,
      clinicByTenantId,
    ]);

  const selectedSubscription =
    useMemo(() => {
      if (!detailsTenantId) {
        return null;
      }

      return (
        tenants.find(
          (tenant) =>
            tenant.tenantId ===
            detailsTenantId
        ) ?? null
      );
    }, [
      detailsTenantId,
      tenants,
    ]);

  const totalPages =
    tenantsData?.totalPages ??
    0;

  const totalElements =
    tenantsData?.totalElements ??
    tenants.length;

  const isLoading =
    isTenantsLoading ||
    isClinicsLoading;

  async function handleSuspend(
    tenantId: string,
    clinicName: string
  ) {
    const confirmed =
      window.confirm(
        t("dashboard.table.suspendConfirm", { clinicName })
      );

    if (!confirmed) {
      return;
    }

    try {
      await suspendMutation.mutateAsync(
        tenantId
      );

      toast.success(
        t("dashboard.toast.suspended")
      );
    } catch {
      toast.error(
        t("dashboard.toast.suspendFailed")
      );
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border-color bg-white shadow-sm">
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-color px-6 py-5">
        <div>
          <p className="text-sm text-text-light">
            {t("dashboard.header.totalLabel")}{" "}
            <span className="font-bold text-dark-navy">
              {totalElements}
            </span>{" "}
            {t("dashboard.header.totalSuffix")}
          </p>

          {isClinicsError && (
            <p className="mt-1 text-xs text-red-500">
              {t("dashboard.header.clinicNamesLoadError")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(
            (statusOption) => (
              <button
                key={statusOption}
                type="button"
                onClick={() => {
                  setStatus(
                    statusOption
                  );

                  setPage(0);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  status ===
                  statusOption
                    ? "bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {statusOption}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2
            className="animate-spin"
            size={25}
          />
        </div>
      ) : isTenantsError ? (
        <p className="px-6 py-12 text-center text-sm text-red-500">
          {t("dashboard.table.loadError")}
        </p>
      ) : tenants.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-slate-400">
          {t("dashboard.table.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-color text-xs uppercase text-slate-400">
                <th className="px-6 py-4 font-semibold">
                  {t("dashboard.table.headers.clinic")}
                </th>

                <th className="px-6 py-4 font-semibold">
                  {t("dashboard.table.headers.status")}
                </th>

                <th className="px-6 py-4 font-semibold">
                  {t("dashboard.table.headers.plan")}
                </th>

                <th className="px-6 py-4 font-semibold">
                  {t("dashboard.table.headers.validity")}
                </th>

                <th className="px-6 py-4 font-semibold">
                  {t("dashboard.table.headers.sms")}
                </th>

                <th className="px-6 py-4 font-semibold">
                  {t("dashboard.table.headers.storage")}
                </th>

                <th className="px-6 py-4 text-right font-semibold">
                  {t("dashboard.table.headers.actions")}
                </th>
              </tr>
            </thead>

            <tbody>
              {tenants.map(
                (tenant) => {
                  const tenantId =
                    tenant.tenantId;

                  const clinic =
                    clinicByTenantId.get(
                      tenantId
                    );

                  const clinicName =
                    clinic?.name ||
                    t("dashboard.table.clinicNotFound");

                  return (
                    <tr
                      key={tenantId}
                      onClick={() =>
                        setDetailsTenantId(
                          tenantId
                        )
                      }
                      className="cursor-pointer border-b border-border-color transition last:border-0 hover:bg-slate-50/80"
                    >
                      {/* Clinic */}

                      <td className="px-6 py-5">
                        <p className="font-semibold text-dark-navy">
                          {clinicName}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {clinic?.subDomain
                            ? `${clinic.subDomain}.dental.ilmtech.uz`
                            : t("dashboard.table.noSubdomain")}
                        </p>
                      </td>

                      {/* Status */}

                      <td className="px-6 py-5">
                        <StatusBadge
                          status={
                            tenant.status
                          }
                        />
                      </td>

                      {/* Plan */}

                      <td className="px-6 py-5 font-semibold text-slate-600">
                        {tenant.currentPlan ||
                          "—"}
                      </td>

                      {/* Dates */}

                      <td className="px-6 py-5 text-slate-500">
                        {formatDate(
                          tenant.startDate
                        )}
                        {" → "}
                        {formatDate(
                          tenant.endDate
                        )}
                      </td>

                      {/* SMS */}

                      <td className="px-6 py-5 text-slate-500">
                        {tenant.smsBalance ??
                          0}
                      </td>

                      {/* Storage */}

                      <td className="px-6 py-5 text-slate-500">
                        {formatBytes(
                          tenant.currentStorageBytes
                        )}
                      </td>

                      {/* Actions */}

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              setDetailsTenantId(
                                tenantId
                              );
                            }}
                            className="flex items-center gap-1 rounded-lg border border-border-color px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            <Info
                              size={14}
                            />

                            {t("dashboard.table.detailsButton")}
                          </button>

                          <button
                            type="button"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              setLimitsTenantId(
                                tenantId
                              );
                            }}
                            className="rounded-lg border border-border-color px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            {t("dashboard.table.limitsButton")}
                          </button>

                          <button
                            type="button"
                            disabled={
                              suspendMutation.isPending ||
                              tenant.status ===
                                "SUSPENDED"
                            }
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              void handleSuspend(
                                tenantId,
                                clinicName
                              );
                            }}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Ban
                              size={14}
                            />

                            {t("dashboard.table.suspendButton")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-border-color px-6 py-5">
          <button
            type="button"
            disabled={page === 0}
            onClick={() =>
              setPage(
                (currentPage) =>
                  Math.max(
                    0,
                    currentPage - 1
                  )
              )
            }
            className="rounded-lg border border-border-color px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("dashboard.pagination.previous")}
          </button>

          <span className="text-xs text-slate-400">
            {page + 1} /{" "}
            {totalPages}
          </span>

          <button
            type="button"
            disabled={
              page + 1 >=
              totalPages
            }
            onClick={() =>
              setPage(
                (currentPage) =>
                  currentPage + 1
              )
            }
            className="rounded-lg border border-border-color px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("dashboard.pagination.next")}
          </button>
        </div>
      )}

      {/* Detail modal */}

      {detailsTenantId && (
        <ClinicDetailModal
          tenantId={
            detailsTenantId
          }
          clinic={
            selectedClinic
          }
          subscription={
            selectedSubscription
          }
          onClose={() =>
            setDetailsTenantId(
              null
            )
          }
        />
      )}

      {/* Limits edit modal */}

      {limitsTenantId && (
        <TenantLimitsEditModal
          tenantId={
            limitsTenantId
          }
          onClose={() =>
            setLimitsTenantId(
              null
            )
          }
        />
      )}
    </div>
  );
}

/* =====================================================
 * STATUS BADGE
 * ===================================================== */

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
        status
      )}`}
    >
      {status || "—"}
    </span>
  );
}

/* =====================================================
 * DETAIL MODAL
 * ===================================================== */

function ClinicDetailModal({
  tenantId,
  clinic,
  subscription,
  onClose,
}: {
  tenantId: string;
  clinic: ClinicSummary | null;
  subscription: TenantSubscription | null;
  onClose: () => void;
}) {
  const t = useTranslations("superadmin");
  /*
   * Faqat limits API chaqiriladi.
   *
   * GET:
   * /api/dental/subscriptions/admin/tenants/{tenantId}/limits
   *
   * Clinic by ID API chaqirilmaydi.
   */
  const {
    data: tenantLimits,
    isLoading:
      isLimitsLoading,
    isError:
      isLimitsError,
  } = useTenantLimits(
    tenantId
  );

  useModalBehaviour(onClose);

  return (
    <ModalContainer
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      {/* Header */}

      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border-color bg-white px-6 py-5">
        <div>
          <h2 className="text-xl font-bold text-dark-navy">
            {clinic?.name ||
              t("dashboard.detailModal.clinicInfoTitle")}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {clinic?.subDomain
              ? `${clinic.subDomain}.dental.ilmtech.uz`
              : t("dashboard.table.noSubdomain")}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={21} />
        </button>
      </div>

      {/* Content */}

      <div className="space-y-5 p-6">
        {clinic ? (
          <DetailSection
            title={t("dashboard.detailModal.clinicInfoTitle")}
            data={
              clinic as DetailData
            }
            hiddenKeys={
              HIDDEN_CLINIC_FIELDS
            }
          />
        ) : (
          <EmptyDetailSection
            title={t("dashboard.detailModal.clinicInfoTitle")}
            message={t("dashboard.detailModal.clinicNotFoundMessage")}
            error
          />
        )}

        {subscription ? (
          <DetailSection
            title={t("dashboard.detailModal.subscriptionInfoTitle")}
            data={
              subscription as any
            }
            hiddenKeys={
              HIDDEN_SUBSCRIPTION_FIELDS
            }
          />
        ) : (
          <EmptyDetailSection
            title={t("dashboard.detailModal.subscriptionInfoTitle")}
            message={t("dashboard.detailModal.subscriptionNotFoundMessage")}
          />
        )}

        {isLimitsLoading ? (
          <SectionLoading
            title={t("dashboard.detailModal.limitsTitle")}
          />
        ) : isLimitsError ? (
          <EmptyDetailSection
            title={t("dashboard.detailModal.limitsTitle")}
            message={t("dashboard.detailModal.limitsLoadError")}
            error
          />
        ) : tenantLimits ? (
          <DetailSection
            title={t("dashboard.detailModal.limitsTitle")}
            data={
              tenantLimits as DetailData
            }
            hiddenKeys={[
              "id",
              "tenantId",
            ]}
          />
        ) : (
          <EmptyDetailSection
            title={t("dashboard.detailModal.limitsTitle")}
            message={t("dashboard.detailModal.limitsNotFoundMessage")}
          />
        )}
      </div>

      {/* Footer */}

      <div className="sticky bottom-0 flex justify-end border-t border-border-color bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border-color px-5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          {t("dashboard.detailModal.closeButton")}
        </button>
      </div>
    </ModalContainer>
  );
}

/* =====================================================
 * LIMITS EDIT MODAL
 * ===================================================== */

function TenantLimitsEditModal({
  tenantId,
  onClose,
}: {
  tenantId: string;
  onClose: () => void;
}) {
  const t = useTranslations("superadmin");
  const toast = useToast();

  const {
    data,
    isLoading,
    isError,
  } = useTenantLimits(
    tenantId
  );

  const updateMutation =
    useUpdateTenantLimits();

  const [form, setForm] =
    useState<
      Record<string, string>
    >({});

  useModalBehaviour(onClose);

  useEffect(() => {
    if (!data) {
      return;
    }

    const initialForm: Record<
      string,
      string
    > = {};

    Object.entries(data).forEach(
      ([key, value]) => {
        if (
          READ_ONLY_LIMIT_FIELDS.has(
            key
          )
        ) {
          return;
        }

        if (
          typeof value ===
            "number" ||
          typeof value ===
            "string"
        ) {
          initialForm[key] =
            String(value);
        }
      }
    );

    setForm(initialForm);
  }, [data]);

  async function handleSave() {
    const payload: Record<
      string,
      unknown
    > = {};

    Object.entries(form).forEach(
      ([key, value]) => {
        const numericValue =
          Number(value);

        payload[key] =
          value.trim() !== "" &&
          Number.isFinite(
            numericValue
          )
            ? numericValue
            : value;
      }
    );

    try {
      await updateMutation.mutateAsync({
        tenantId,
        payload,
      });

      toast.success(
        t("dashboard.limitsModal.toastUpdated")
      );

      onClose();
    } catch {
      toast.error(
        t("dashboard.limitsModal.toastUpdateFailed")
      );
    }
  }

  return (
    <ModalContainer
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {/* Header */}

      <div className="flex items-center justify-between border-b border-border-color px-6 py-5">
        <h2 className="text-lg font-bold text-dark-navy">
          {t("dashboard.detailModal.limitsTitle")}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2
              className="animate-spin text-slate-400"
              size={23}
            />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red-500">
            {t("dashboard.limitsModal.loadError")}
          </p>
        ) : Object.keys(form)
            .length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            {t("dashboard.limitsModal.emptyFields")}
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(
              form
            ).map(
              ([
                key,
                value,
              ]) => (
                <div key={key}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {formatFieldLabel(
                      key,
                      t
                    )}
                  </label>

                  <input
                    type="text"
                    value={value}
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          currentForm
                        ) => ({
                          ...currentForm,
                          [key]:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-border-color bg-slate-50 px-3 text-sm text-dark-navy outline-none transition focus:border-primary-blue focus:bg-white"
                  />
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer */}

      <div className="flex justify-end gap-2 border-t border-border-color px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border-color px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          {t("dashboard.limitsModal.cancelButton")}
        </button>

        <button
          type="button"
          disabled={
            isLoading ||
            isError ||
            updateMutation.isPending ||
            Object.keys(form)
              .length === 0
          }
          onClick={() =>
            void handleSave()
          }
          className="rounded-xl bg-gradient-to-r from-sky-500 via-violet-600 to-rose-500 px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateMutation.isPending
            ? t("dashboard.limitsModal.saving")
            : t("dashboard.limitsModal.saveButton")}
        </button>
      </div>
    </ModalContainer>
  );
}

/* =====================================================
 * MODAL CONTAINER
 * ===================================================== */

function ModalContainer({
  children,
  onClose,
  maxWidth,
}: {
  children: ReactNode;
  onClose: () => void;
  maxWidth: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[1px]"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl ${maxWidth}`}
      >
        {children}
      </div>
    </div>
  );
}

/* =====================================================
 * DETAIL SECTION
 * ===================================================== */

function DetailSection({
  title,
  data,
  hiddenKeys = [],
}: {
  title: string;
  data: DetailData;
  hiddenKeys?: string[];
}) {
  const t = useTranslations("superadmin");
  const hiddenKeysSet =
    new Set(hiddenKeys);

  const fields =
    Object.entries(data).filter(
      ([key]) =>
        !hiddenKeysSet.has(key)
    );

  return (
    <section className="overflow-hidden rounded-2xl border border-border-color">
      <div className="border-b border-border-color bg-slate-50 px-5 py-3">
        <h3 className="text-sm font-bold text-dark-navy">
          {title}
        </h3>
      </div>

      {fields.length === 0 ? (
        <p className="px-5 py-7 text-center text-sm text-slate-400">
          {t("dashboard.detailModal.noData")}
        </p>
      ) : (
        <div className="divide-y divide-border-color/70">
          {fields.map(
            ([key, value]) => (
              <div
                key={key}
                className="grid gap-2 px-5 py-3 sm:grid-cols-[240px_minmax(0,1fr)]"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {formatFieldLabel(
                    key,
                    t
                  )}
                </span>

                <span className="whitespace-pre-wrap break-all text-sm font-semibold text-dark-navy">
                  {formatFieldValue(
                    key,
                    value,
                    t
                  )}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

/* =====================================================
 * EMPTY SECTION
 * ===================================================== */

function EmptyDetailSection({
  title,
  message,
  error = false,
}: {
  title: string;
  message: string;
  error?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border ${
        error
          ? "border-red-200"
          : "border-border-color"
      }`}
    >
      <div
        className={`border-b px-5 py-3 ${
          error
            ? "border-red-200 bg-red-50"
            : "border-border-color bg-slate-50"
        }`}
      >
        <h3
          className={`text-sm font-bold ${
            error
              ? "text-red-600"
              : "text-dark-navy"
          }`}
        >
          {title}
        </h3>
      </div>

      <p
        className={`px-5 py-7 text-center text-sm ${
          error
            ? "text-red-500"
            : "text-slate-400"
        }`}
      >
        {message}
      </p>
    </section>
  );
}

/* =====================================================
 * SECTION LOADING
 * ===================================================== */

function SectionLoading({
  title,
}: {
  title: string;
}) {
  const t = useTranslations("superadmin");

  return (
    <section className="overflow-hidden rounded-2xl border border-border-color">
      <div className="border-b border-border-color bg-slate-50 px-5 py-3">
        <h3 className="text-sm font-bold text-dark-navy">
          {title}
        </h3>
      </div>

      <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
        <Loader2
          className="animate-spin"
          size={19}
        />

        {t("dashboard.loading")}
      </div>
    </section>
  );
}

/* =====================================================
 * MODAL BEHAVIOUR
 * ===================================================== */

function useModalBehaviour(
  onClose: () => void
) {
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
      document.body.style
        .overflow;

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
}