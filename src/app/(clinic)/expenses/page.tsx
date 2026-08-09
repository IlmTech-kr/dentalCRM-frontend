"use client";

import { useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  Receipt,
  RefreshCcw,
  Wallet,
} from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";
import { useGetExpenseCategories } from "@/src/features/expenses/hooks/useExpenseCategories";
import {
  useGetExpenses,
  useGetExpenseSummary,
  useCreateExpense,
  usePayExpense,
  useVoidExpense,
} from "@/src/features/expenses/hooks/useExpenses";
import type {
  Currency,
  Expense,
  ExpenseStatus,
} from "@/src/features/expenses/types";
import { formatExpenseMoney } from "@/src/features/expenses/format";
import { normalizeDateForInput, startOfMonthYMD, todayYMD } from "@/src/features/expenses/dates";
import { CURRENCIES, DEFAULT_PAGE_SIZE, EXPENSE_STATUSES } from "@/src/features/expenses/constants";
import { getStatusLabel, getStatusStyle, isVoided } from "@/src/features/expenses/status";
import { ModalShell } from "./_components/ModalShell";
import { ModalFormActions } from "./_components/ModalFormActions";
import { EmptyState, LoadingState } from "./_components/EmptyState";
import {
  dangerFieldClassName,
  fieldClassName,
  fieldLabelClassName,
  filterFieldClassName,
} from "./_components/formFieldStyles";

// ---------------------------------------------------------------------------
// Create expense modal
// ---------------------------------------------------------------------------

function CreateExpenseModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations("expenses.list");
  const toast = useToast();
  const createMutation = useCreateExpense();

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("UZS");
  const [expenseDate, setExpenseDate] = useState(todayYMD());
  const [payeeName, setPayeeName] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!categoryId) return toast.error(t("toast.categoryRequired"));
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) return toast.error(t("toast.amountRequired"));
    if (!payeeName.trim()) return toast.error(t("toast.payeeRequired"));
    if (!expenseDate) return toast.error(t("toast.dateRequired"));

    createMutation.mutate(
      {
        categoryId,
        amount: amountNumber,
        currency,
        expenseDate,
        status: "PENDING",
        payeeName: payeeName.trim(),
        description: description.trim() || undefined,
        reference: reference.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("toast.created"));
          onCreated();
        },
        onError: (error) => toast.error(error.message || t("toast.saveFailed")),
      }
    );
  }

  return (
    <ModalShell title={t("createModal.title")} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="max-h-[calc(92vh-140px)] space-y-4 overflow-y-auto px-6 py-6">
        <div>
          <label className={fieldLabelClassName}>{t("createModal.categoryLabel")}</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldClassName}>
            <option value="">{t("createModal.categoryPlaceholder")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={fieldLabelClassName}>{t("createModal.amountLabel")}</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
              className={fieldClassName}
            />
          </div>
          <div>
            <label className={fieldLabelClassName}>{t("createModal.currencyLabel")}</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={fieldClassName}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("createModal.dateLabel")}</label>
          <input
            type="date"
            value={normalizeDateForInput(expenseDate)}
            onChange={(e) => setExpenseDate(e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("createModal.payeeLabel")}</label>
          <input
            type="text"
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            placeholder={t("createModal.payeePlaceholder")}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("createModal.descriptionLabel")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("createModal.descriptionPlaceholder")}
            rows={2}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("createModal.referenceLabel")}</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t("createModal.referencePlaceholder")}
            className={fieldClassName}
          />
        </div>

        <ModalFormActions
          cancelLabel={t("createModal.cancel")}
          submitLabel={t("createModal.create")}
          onCancel={onClose}
          isSubmitting={createMutation.isPending}
        />
      </form>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Pay modal
// ---------------------------------------------------------------------------

function PayExpenseModal({
  expense,
  onClose,
  onPaid,
}: {
  expense: Expense;
  onClose: () => void;
  onPaid: () => void;
}) {
  const t = useTranslations("expenses.list");
  const toast = useToast();
  const payMutation = usePayExpense();

  const [paidAt, setPaidAt] = useState(todayYMD());

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paidAt) return toast.error(t("toast.dateRequired"));

    payMutation.mutate(
      { id: expense.id, payload: { paidAt } },
      {
        onSuccess: () => {
          toast.success(t("toast.paid"));
          onPaid();
        },
        onError: (error) => toast.error(error.message || t("toast.payFailed")),
      }
    );
  }

  return (
    <ModalShell
      title={t("payModal.title")}
      subtitle={t("payModal.subtitle")}
      onClose={onClose}
      showCloseButton={false}
      maxWidthClassName="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
        <div>
          <label className={fieldLabelClassName}>{t("payModal.dateLabel")}</label>
          <input
            type="date"
            value={normalizeDateForInput(paidAt)}
            onChange={(e) => setPaidAt(e.target.value)}
            className={fieldClassName}
            autoFocus
          />
        </div>

        <ModalFormActions
          cancelLabel={t("payModal.cancel")}
          submitLabel={t("payModal.confirm")}
          onCancel={onClose}
          isSubmitting={payMutation.isPending}
          submitColorClassName="bg-emerald-600 hover:bg-emerald-700"
        />
      </form>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Void modal
// ---------------------------------------------------------------------------

function VoidExpenseModal({
  expense,
  onClose,
  onVoided,
}: {
  expense: Expense;
  onClose: () => void;
  onVoided: () => void;
}) {
  const t = useTranslations("expenses.list");
  const toast = useToast();
  const voidMutation = useVoidExpense();

  const [reason, setReason] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return toast.error(t("toast.reasonRequired"));

    voidMutation.mutate(
      { id: expense.id, payload: { reason: trimmed } },
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

export default function ExpensesPage() {
  const t = useTranslations("expenses.list");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "0") || 0;
  // Filtrsiz holatda cheksiz sana oralig'i yubormaslik uchun — standart
  // qiymat joriy oy (backend /expenses/summary'ga sana berilmasa xatolik
  // qaytargani aniqlandi).
  const fromDate = searchParams.get("fromDate") ?? startOfMonthYMD();
  const toDate = searchParams.get("toDate") ?? todayYMD();
  const categoryId = searchParams.get("categoryId") ?? "";
  const status = searchParams.get("status") ?? "";
  const currency = searchParams.get("currency") ?? "";

  const [createOpen, setCreateOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Expense | null>(null);
  const [voidTarget, setVoidTarget] = useState<Expense | null>(null);

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
      categoryId: categoryId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      status: (status || undefined) as ExpenseStatus | undefined,
      currency: (currency || undefined) as Currency | undefined,
    }),
    [page, categoryId, fromDate, toDate, status, currency]
  );

  const summaryParams = useMemo(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      currency: (currency || undefined) as Currency | undefined,
      status: (status || undefined) as ExpenseStatus | undefined,
    }),
    [fromDate, toDate, currency, status]
  );

  const { data: categories = [] } = useGetExpenseCategories();
  const {
    data: expenseList,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch: refetchList,
  } = useGetExpenses(listParams);
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } =
    useGetExpenseSummary(summaryParams);

  const items = expenseList?.items ?? [];
  const totalPages = expenseList?.totalPages ?? 0;

  // Fallback: agar summary maydonlari kelmasa, joriy sahifadagi ro'yxatdan hisoblanadi.
  const totalAmount = summary?.totalAmount || items.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalCount = summary?.totalCount || expenseList?.totalElements || items.length;

  function refreshAll() {
    refetchList();
    refetchSummary();
  }

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const hasActiveFilters = Boolean(
    searchParams.get("fromDate") ||
      searchParams.get("toDate") ||
      categoryId ||
      status ||
      currency
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("page.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("page.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refreshAll}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCcw size={15} className={isListFetching ? "animate-spin" : ""} />
            {t("page.refresh")}
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-blue-dark"
          >
            <Plus size={16} />
            {t("page.addButton")}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
            <Wallet size={14} className="text-primary-blue" />
            {t("summary.totalAmount")}
          </div>
          {isSummaryLoading ? (
            <div className="mt-3 h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-2 text-2xl font-black text-slate-900">
              {formatExpenseMoney(totalAmount, summary?.currency || currency || "UZS")}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
            <Receipt size={14} className="text-primary-blue" />
            {t("summary.totalCount")}
          </div>
          {isSummaryLoading ? (
            <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-2 text-2xl font-black text-slate-900">{totalCount}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">{t("filters.fromDate")}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => updateParams({ fromDate: e.target.value })}
            className={filterFieldClassName}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">{t("filters.toDate")}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => updateParams({ toDate: e.target.value })}
            className={filterFieldClassName}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">{t("filters.category")}</label>
          <select
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: e.target.value })}
            className={filterFieldClassName}
          >
            <option value="">{t("filters.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">{t("filters.status")}</label>
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className={filterFieldClassName}
          >
            <option value="">{t("filters.allStatuses")}</option>
            {EXPENSE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500">{t("filters.currency")}</label>
          <select
            value={currency}
            onChange={(e) => updateParams({ currency: e.target.value })}
            className={filterFieldClassName}
          >
            <option value="">{t("filters.allCurrencies")}</option>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
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
        ) : items.length === 0 ? (
          <EmptyState icon={Receipt} message={t("table.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t("table.date")}</th>
                  <th className="px-4 py-3">{t("table.category")}</th>
                  <th className="px-4 py-3">{t("table.payee")}</th>
                  <th className="px-4 py-3">{t("table.reference")}</th>
                  <th className="px-4 py-3 text-right">{t("table.amount")}</th>
                  <th className="px-4 py-3">{t("table.status")}</th>
                  <th className="px-4 py-3 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((expense, index) => {
                  const statusStyle = getStatusStyle(expense.status);
                  const canPay = expense.status === "PENDING";
                  const canVoid = !isVoided(expense.status);

                  return (
                    <tr key={expense.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 text-slate-400">{page * DEFAULT_PAGE_SIZE + index + 1}</td>
                      <td className="px-4 py-3 text-slate-600">{expense.expenseDate}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {expense.category?.name || categoryNameById.get(expense.categoryId) || "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{expense.payeeName}</td>
                      <td className="px-4 py-3 text-slate-400">{expense.reference || "—"}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">
                        {formatExpenseMoney(expense.amount, expense.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-black"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                        >
                          {getStatusLabel(t, expense.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canPay && (
                            <button
                              type="button"
                              onClick={() => setPayTarget(expense)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <CreditCard size={13} />
                              {t("actions.pay")}
                            </button>
                          )}
                          {canVoid && (
                            <button
                              type="button"
                              onClick={() => setVoidTarget(expense)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                            >
                              <Ban size={13} />
                              {t("actions.void")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {createOpen && (
        <CreateExpenseModal
          categories={categories}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            refreshAll();
          }}
        />
      )}

      {payTarget && (
        <PayExpenseModal
          expense={payTarget}
          onClose={() => setPayTarget(null)}
          onPaid={() => {
            setPayTarget(null);
            refreshAll();
          }}
        />
      )}

      {voidTarget && (
        <VoidExpenseModal
          expense={voidTarget}
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
