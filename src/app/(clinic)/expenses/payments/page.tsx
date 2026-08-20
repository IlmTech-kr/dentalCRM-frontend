"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Coins,
  Receipt,
  RefreshCcw,
  SortAsc,
  SortDesc,
} from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";
import { ModalShell } from "@/src/components/ui/ModalShell";
import { ModalFormActions } from "@/src/components/ui/ModalFormActions";
import { EmptyState, LoadingState } from "@/src/components/ui/EmptyState";
import { dangerFieldClassName, fieldLabelClassName, filterFieldClassName } from "@/src/components/ui/formFieldStyles";
import { DateInput } from "@/src/components/ui/DateInput";
import {
  useGetTreatmentPayments,
  useGetTreatmentPaymentsSummary,
  useVoidTreatmentPaymentGlobal,
} from "@/src/features/treatment-payments/hooks/useTreatmentPayments";
import type { TreatmentPaymentListItem } from "@/src/features/treatment-payments/types";
import { formatPaymentMoney } from "@/src/features/treatment-payments/format";
import { formatDateTimeDisplay } from "@/src/features/treatment-payments/dates";
import { getMethodLabel } from "@/src/features/treatment-payments/method";
import { DEFAULT_PAGE_SIZE } from "@/src/features/treatment-payments/constants";
import { startOfMonthYMD, todayYMD } from "@/src/features/expenses/dates";

// ---------------------------------------------------------------------------
// Void payment modal
// ---------------------------------------------------------------------------

function VoidPaymentModal({
  payment,
  onClose,
  onVoided,
}: {
  payment: TreatmentPaymentListItem;
  onClose: () => void;
  onVoided: () => void;
}) {
  const t = useTranslations("payments.list");
  const toast = useToast();
  const voidMutation = useVoidTreatmentPaymentGlobal();

  const [reason, setReason] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return toast.error(t("toast.reasonRequired"));

    voidMutation.mutate(
      { courseId: payment.treatmentCourseId, paymentId: payment.id, payload: { reason: trimmed } },
      {
        onSuccess: () => {
          toast.success(t("toast.voided"));
          onVoided();
        },
        onError: (error) => toast.error(error.message || t("toast.voidFailed")),
      }
    );
  }

  return (
    <ModalShell
      title={t("voidModal.title")}
      subtitle={t("voidModal.subtitle")}
      onClose={onClose}
      showCloseButton={false}
      maxWidthClassName="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
        <div>
          <label className={fieldLabelClassName}>{t("voidModal.reasonLabel")}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("voidModal.reasonPlaceholder")}
            rows={3}
            className={dangerFieldClassName}
            autoFocus
          />
        </div>

        <ModalFormActions
          cancelLabel={t("voidModal.cancel")}
          submitLabel={t("voidModal.confirm")}
          onCancel={onClose}
          isSubmitting={voidMutation.isPending}
          submitColorClassName="bg-red-600 hover:bg-red-700"
        />
      </form>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TreatmentPaymentsPage() {
  const t = useTranslations("payments.list");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "0") || 0;
  const fromDate = searchParams.get("fromDate") ?? startOfMonthYMD();
  const toDate = searchParams.get("toDate") ?? todayYMD();
  const showVoided = searchParams.get("voided") === "true";
  const sortDirection = (searchParams.get("sortDirection") as "ASC" | "DESC") || "DESC";

  const [voidTarget, setVoidTarget] = useState<TreatmentPaymentListItem | null>(null);

  function updateParams(patch: Record<string, string | number | undefined>, resetPage = true) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    if (resetPage) next.set("page", "0");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const listParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      voided: showVoided ? undefined : false,
      sortBy: "paidAt",
      sortDirection,
    }),
    [page, fromDate, toDate, showVoided, sortDirection]
  );

  const summaryParams = useMemo(
    () => ({ fromDate: fromDate || undefined, toDate: toDate || undefined }),
    [fromDate, toDate]
  );

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch: refetchList,
  } = useGetTreatmentPayments(listParams);
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } =
    useGetTreatmentPaymentsSummary(summaryParams);

  const payments = listData?.payments ?? [];
  const total = listData?.total ?? 0;
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);

  function refreshAll() {
    refetchList();
    refetchSummary();
  }

  const hasActiveFilters = Boolean(
    searchParams.get("fromDate") || searchParams.get("toDate") || showVoided || searchParams.get("sortDirection")
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("page.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("page.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:w-fit"
        >
          <RefreshCcw size={15} className={isListFetching ? "animate-spin" : ""} />
          {t("page.refresh")}
        </button>
      </div>

      {/* Summary cards — one per currency, never summed */}
      {isSummaryLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : !summary?.currencies?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-400">
          {t("summary.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.currencies.map((entry) => (
            <div key={entry.currency} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <Coins size={14} className="text-primary-blue" />
                {t("summary.received")} · {entry.currency}
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {formatPaymentMoney(entry.receivedAmount, entry.currency)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {t("summary.count")}: {entry.paymentCount}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">{t("filters.fromDate")}</label>
          <DateInput
            value={fromDate}
            onChange={(value) => updateParams({ fromDate: value })}
            max={toDate}
            className={`${filterFieldClassName} flex items-center gap-2 text-left`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">{t("filters.toDate")}</label>
          <DateInput
            value={toDate}
            onChange={(value) => updateParams({ toDate: value })}
            min={fromDate}
            className={`${filterFieldClassName} flex items-center gap-2 text-left`}
          />
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={showVoided}
            onChange={(e) => updateParams({ voided: e.target.checked ? "true" : undefined })}
            className="h-4 w-4 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
          />
          {t("filters.showVoided")}
        </label>

        <button
          type="button"
          onClick={() => updateParams({ sortDirection: sortDirection === "DESC" ? "ASC" : "DESC" }, false)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          {sortDirection === "DESC" ? <SortDesc size={15} /> : <SortAsc size={15} />}
          {sortDirection === "DESC" ? t("filters.sortDirectionDesc") : t("filters.sortDirectionAsc")}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            {t("filters.reset")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isListLoading ? (
          <LoadingState />
        ) : payments.length === 0 ? (
          <EmptyState icon={Receipt} message={t("table.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">{t("table.date")}</th>
                  <th className="px-4 py-3">{t("table.patient")}</th>
                  <th className="px-4 py-3">{t("table.diagnosis")}</th>
                  <th className="px-4 py-3">{t("table.method")}</th>
                  <th className="px-4 py-3 text-right">{t("table.amount")}</th>
                  <th className="px-4 py-3">{t("table.reference")}</th>
                  <th className="px-4 py-3">{t("table.status")}</th>
                  <th className="px-4 py-3 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment.id} data-entity-id={payment.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-400">{page * DEFAULT_PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTimeDisplay(payment.paidAt)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <Link
                        href={`/treatments/${payment.patientId}`}
                        className="hover:text-primary-blue hover:underline"
                      >
                        {payment.patientName}
                      </Link>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">
                      {payment.courseDiagnosis || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#e0f2fe] px-2.5 py-1 text-xs font-black text-[#0ea5e9]">
                        {getMethodLabel(t, payment.method)}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-black ${
                        payment.voided ? "text-slate-400 line-through" : "text-slate-900"
                      }`}
                    >
                      {formatPaymentMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{payment.reference || "—"}</td>
                    <td className="px-4 py-3">
                      {payment.voided ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                          {t("status.voided")}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                          {t("status.paid")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!payment.voided && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setVoidTarget(payment)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                          >
                            <Ban size={13} />
                            {t("actions.void")}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => updateParams({ page: page - 1 }, false)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              {t("pagination.prev")}
            </button>
            <span className="text-xs font-bold text-slate-400">
              {t("pagination.pageOf", { page: page + 1, totalPages })}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => updateParams({ page: page + 1 }, false)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("pagination.next")}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {voidTarget && (
        <VoidPaymentModal
          payment={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            setVoidTarget(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
