"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Edit3, Plus, Tags } from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";
import {
  useGetExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
} from "@/src/features/expenses/hooks/useExpenseCategories";
import type {
  ExpenseCategory,
  ExpenseCategoryKind,
} from "@/src/features/expenses/types";
import { formatDisplayDate } from "@/src/features/expenses/dates";
import { CATEGORY_KIND_OPTIONS, getCategoryKindConfig } from "@/src/features/expenses/categoryKind";
import { ModalShell } from "../_components/ModalShell";
import { ModalFormActions } from "../_components/ModalFormActions";
import { EmptyState, LoadingState } from "../_components/EmptyState";
import { fieldClassName, fieldLabelClassName } from "../_components/formFieldStyles";

// ---------------------------------------------------------------------------
// Category modal (create/edit)
// ---------------------------------------------------------------------------

function CategoryModal({
  category,
  onClose,
  onSubmit,
  isSaving,
}: {
  category: ExpenseCategory | null;
  onClose: () => void;
  onSubmit: (name: string, kind: ExpenseCategoryKind) => void;
  isSaving: boolean;
}) {
  const t = useTranslations("expenses.categories");
  const toast = useToast();

  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<ExpenseCategoryKind>(category?.kind ?? "TECHNICAL");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return toast.error(t("toast.nameRequired"));
    if (trimmed.length < 2) return toast.error(t("toast.nameTooShort"));

    onSubmit(trimmed, kind);
  }

  return (
    <ModalShell
      title={category ? t("modal.editTitle") : t("modal.createTitle")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
        <div>
          <label className={fieldLabelClassName}>{t("modal.nameLabel")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("modal.namePlaceholder")}
            className={fieldClassName}
            autoFocus
          />
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("modal.kindLabel")}</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ExpenseCategoryKind)}
            className={fieldClassName}
          >
            {CATEGORY_KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(`kind.${opt.value}`)}
              </option>
            ))}
          </select>
        </div>

        <ModalFormActions
          cancelLabel={t("modal.cancel")}
          submitLabel={category ? t("modal.update") : t("modal.create")}
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

export default function ExpenseCategoriesPage() {
  const t = useTranslations("expenses.categories");
  const toast = useToast();

  const { data: categories = [], isLoading } = useGetExpenseCategories();
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();

  const [modalCategory, setModalCategory] = useState<ExpenseCategory | null | undefined>(undefined);

  function closeModal() {
    setModalCategory(undefined);
  }

  function handleSubmit(name: string, kind: ExpenseCategoryKind) {
    if (modalCategory) {
      updateMutation.mutate(
        { id: modalCategory.id, name, kind },
        {
          onSuccess: () => {
            toast.success(t("toast.updated"));
            closeModal();
          },
          onError: (error) => toast.error(error.message || t("toast.saveFailed")),
        }
      );
    } else {
      createMutation.mutate(
        { name, kind },
        {
          onSuccess: () => {
            toast.success(t("toast.created"));
            closeModal();
          },
          onError: (error) => toast.error(error.message || t("toast.saveFailed")),
        }
      );
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{t("page.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("page.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setModalCategory(null)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-blue-dark sm:w-fit"
        >
          <Plus size={16} />
          {t("page.addButton")}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <LoadingState />
        ) : categories.length === 0 ? (
          <EmptyState icon={Tags} message={t("table.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">{t("table.name")}</th>
                  <th className="px-6 py-3">{t("table.kind")}</th>
                  <th className="px-6 py-3">{t("table.updatedAt")}</th>
                  <th className="px-6 py-3 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const config = getCategoryKindConfig(category.kind);
                  return (
                    <tr key={category.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-4 font-bold text-slate-900">{category.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-black"
                          style={{ backgroundColor: config.bg, color: config.color }}
                        >
                          {t(`kind.${category.kind}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDisplayDate(category.updatedAt || category.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setModalCategory(category)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-primary-blue hover:text-primary-blue"
                        >
                          <Edit3 size={13} />
                          {t("actions.edit")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalCategory !== undefined && (
        <CategoryModal
          category={modalCategory}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
