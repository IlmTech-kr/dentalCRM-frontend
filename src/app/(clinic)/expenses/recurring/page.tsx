"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Ban, Edit3, Plus, Repeat, Wallet } from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";
import { useConfirm } from "@/src/lib/hooks/Useconfirm";
import { useGetExpenseCategories } from "@/src/features/expenses/hooks/useExpenseCategories";
import {
  useGetRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useDeactivateRecurringExpense,
} from "@/src/features/expenses/hooks/useRecurringExpenses";
import type { Currency, RecurringExpense } from "@/src/features/expenses/types";
import { formatExpenseMoney } from "@/src/features/expenses/format";
import { formatDisplayDate, normalizeDateForInput, todayYMD } from "@/src/features/expenses/dates";
import { CURRENCIES, DAYS_OF_MONTH } from "@/src/features/expenses/constants";
import { ModalShell } from "@/src/components/ui/ModalShell";
import { ModalFormActions } from "@/src/components/ui/ModalFormActions";
import { EmptyState, LoadingState } from "@/src/components/ui/EmptyState";
import { MoneyInput } from "@/src/components/ui/MoneyInput";
import { fieldClassName, fieldLabelClassName } from "@/src/components/ui/formFieldStyles";
import { DateInput } from "@/src/components/ui/DateInput";

// ---------------------------------------------------------------------------
// Create/edit modal
// ---------------------------------------------------------------------------

function RecurringExpenseModal({
  recurring,
  categories,
  onClose,
  onSaved,
}: {
  recurring: RecurringExpense | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("expenses.recurring");
  const toast = useToast();
  const createMutation = useCreateRecurringExpense();
  const updateMutation = useUpdateRecurringExpense();

  const [categoryId, setCategoryId] = useState(recurring?.categoryId ?? "");
  const [amount, setAmount] = useState(recurring?.amount ?? 0);
  const [currency, setCurrency] = useState<Currency>(recurring?.currency ?? "UZS");
  const [payeeName, setPayeeName] = useState(recurring?.payeeName ?? "");
  const [description, setDescription] = useState(recurring?.description ?? "");
  const [reference, setReference] = useState(recurring?.reference ?? "");
  const [dayOfMonth, setDayOfMonth] = useState(recurring?.dayOfMonth ?? 1);
  const [startDate, setStartDate] = useState(recurring?.startDate ?? todayYMD());
  const [endDate, setEndDate] = useState(recurring?.endDate ?? "");

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!categoryId) return toast.error(t("toast.categoryRequired"));
    if (!amount || amount <= 0) return toast.error(t("toast.amountRequired"));
    if (!payeeName.trim()) return toast.error(t("toast.payeeRequired"));
    if (!description.trim()) return toast.error(t("toast.descriptionRequired"));
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) return toast.error(t("toast.dayOfMonthRequired"));
    if (!startDate) return toast.error(t("toast.startDateRequired"));

    const payload = {
      categoryId,
      amount,
      currency,
      payeeName: payeeName.trim(),
      description: description.trim(),
      reference: reference.trim() || undefined,
      dayOfMonth,
      startDate,
      endDate: endDate || null,
      active: recurring?.active ?? true,
    };

    if (recurring) {
      updateMutation.mutate(
        { id: recurring.id, ...payload },
        {
          onSuccess: () => {
            toast.success(t("toast.updated"));
            onSaved();
          },
          onError: (error) => toast.error(error.message || t("toast.saveFailed")),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(t("toast.created"));
          onSaved();
        },
        onError: (error) => toast.error(error.message || t("toast.saveFailed")),
      });
    }
  }

  return (
    <ModalShell
      title={recurring ? t("modal.editTitle") : t("modal.createTitle")}
      onClose={onClose}
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="max-h-[calc(92vh-140px)] space-y-4 overflow-y-auto px-6 py-6">
        <div>
          <label className={fieldLabelClassName}>{t("modal.categoryLabel")}</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldClassName}>
            <option value="">{t("modal.categoryPlaceholder")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={fieldLabelClassName}>{t("modal.amountLabel")}</label>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              placeholder="3.000.000"
              className={fieldClassName}
            />
          </div>
          <div>
            <label className={fieldLabelClassName}>{t("modal.currencyLabel")}</label>
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
          <label className={fieldLabelClassName}>{t("modal.payeeLabel")}</label>
          <input
            type="text"
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            placeholder={t("modal.payeePlaceholder")}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("modal.descriptionLabel")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("modal.descriptionPlaceholder")}
            rows={2}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("modal.referenceLabel")}</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t("modal.referencePlaceholder")}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("modal.dayOfMonthLabel")}</label>
          <select
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            className={fieldClassName}
          >
            {DAYS_OF_MONTH.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          {dayOfMonth >= 29 && (
            <p className="mt-1.5 text-xs text-amber-600">{t("modal.dayOfMonthHint")}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={fieldLabelClassName}>{t("modal.startDateLabel")}</label>
            <DateInput
              value={normalizeDateForInput(startDate)}
              onChange={setStartDate}
              className={`${fieldClassName} flex items-center gap-2 text-left`}
            />
          </div>
          <div>
            <label className={fieldLabelClassName}>{t("modal.endDateLabel")}</label>
            <DateInput
              value={endDate ? normalizeDateForInput(endDate) : ""}
              onChange={setEndDate}
              min={normalizeDateForInput(startDate)}
              className={`${fieldClassName} flex items-center gap-2 text-left`}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-slate-400">{t("modal.endDateHint")}</p>

        <ModalFormActions
          cancelLabel={t("modal.cancel")}
          submitLabel={recurring ? t("modal.update") : t("modal.create")}
          onCancel={onClose}
          isSubmitting={isSaving}
        />
      </form>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecurringExpensesPage() {
  const t = useTranslations("expenses.recurring");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const confirm = useConfirm();

  const { data: categories = [] } = useGetExpenseCategories();
  const { data, isLoading } = useGetRecurringExpenses();
  const recurringExpenses = data?.items ?? [];
  const totalAmountsByCurrency = data?.totalAmountsByCurrency ?? [];
  const deactivateMutation = useDeactivateRecurringExpense();

  const [activeOnly, setActiveOnly] = useState(false);
  const [modalTarget, setModalTarget] = useState<RecurringExpense | null | undefined>(undefined);

  const visibleItems = useMemo(
    () => (activeOnly ? recurringExpenses.filter((r) => r.active) : recurringExpenses),
    [recurringExpenses, activeOnly]
  );

  function closeModal() {
    setModalTarget(undefined);
  }

  async function handleDeactivate(recurring: RecurringExpense) {
    const ok = await confirm({
      title: tCommon("actions.confirm"),
      message: t("toast.deactivateConfirm", { name: recurring.payeeName }),
    });
    if (!ok) return;

    deactivateMutation.mutate(recurring.id, {
      onSuccess: () => toast.success(t("toast.deactivated")),
      onError: (error) => toast.error(error.message || t("toast.deactivateFailed")),
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("page.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("page.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setModalTarget(null)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-blue-dark sm:w-fit"
        >
          <Plus size={16} />
          {t("page.addButton")}
        </button>
      </div>

      {totalAmountsByCurrency.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totalAmountsByCurrency.map((total) => (
            <div
              key={total.currency}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <Wallet size={14} className="text-primary-blue" />
                {t("summary.total", { currency: total.currency })}
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {formatExpenseMoney(total.totalAmount, total.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveOnly(true)}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            activeOnly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("page.activeOnly")}
        </button>
        <button
          type="button"
          onClick={() => setActiveOnly(false)}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            !activeOnly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("page.all")}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <LoadingState />
        ) : visibleItems.length === 0 ? (
          <EmptyState icon={Repeat} message={t("table.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t("table.category")}</th>
                  <th className="px-4 py-3">{t("table.payee")}</th>
                  <th className="px-4 py-3 text-right">{t("table.amount")}</th>
                  <th className="px-4 py-3">{t("table.dayOfMonth")}</th>
                  <th className="px-4 py-3">{t("table.startDate")}</th>
                  <th className="px-4 py-3">{t("table.endDate")}</th>
                  <th className="px-4 py-3">{t("table.active")}</th>
                  <th className="px-4 py-3 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => (
                  <tr key={item.id} data-entity-id={item.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.category?.name ||
                        categories.find((c) => c.id === item.categoryId)?.name ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.payeeName}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      {formatExpenseMoney(item.amount, item.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.dayOfMonth}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDisplayDate(item.startDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDisplayDate(item.endDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${
                          item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.active ? t("active.yes") : t("active.no")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModalTarget(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-primary-blue hover:text-primary-blue"
                        >
                          <Edit3 size={13} />
                          {t("actions.edit")}
                        </button>
                        {item.active && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(item)}
                            disabled={deactivateMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Ban size={13} />
                            {t("actions.deactivate")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalTarget !== undefined && (
        <RecurringExpenseModal
          recurring={modalTarget}
          categories={categories}
          onClose={closeModal}
          onSaved={closeModal}
        />
      )}
    </div>
  );
}
