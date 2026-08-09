"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Ban, FileText, Plus, Receipt } from "lucide-react";

import { useToast } from "@/src/lib/hooks/Usetoast";
import { ModalShell } from "@/src/components/ui/ModalShell";
import { ModalFormActions } from "@/src/components/ui/ModalFormActions";
import { EmptyState, LoadingState } from "@/src/components/ui/EmptyState";
import { MoneyInput } from "@/src/components/ui/MoneyInput";
import {
  dangerFieldClassName,
  fieldClassName,
  fieldLabelClassName,
} from "@/src/components/ui/formFieldStyles";
import {
  useGetCoursePayments,
  useCreateTreatmentPayment,
  useVoidTreatmentPayment,
} from "@/src/features/treatment-payments/hooks/useTreatmentPayments";
import type { Currency, PaymentMethod, TreatmentPayment } from "@/src/features/treatment-payments/types";
import { getMethodLabel } from "@/src/features/treatment-payments/method";
import { formatPaymentMoney } from "@/src/features/treatment-payments/format";
import { CURRENCIES, PAYMENT_METHODS } from "@/src/features/treatment-payments/constants";
import {
  formatDateTimeDisplay,
  fromDateTimeInputValue,
  nowDateTime,
  toDateTimeInputValue,
} from "@/src/features/treatment-payments/dates";
import {
  useGetInvoiceByCourse,
  useGetInvoiceById,
  useDownloadInvoicePdf,
} from "@/src/features/treatment-invoices/hooks/useInvoice";

// ---------------------------------------------------------------------------
// Add payment modal
// ---------------------------------------------------------------------------

export function AddPaymentModal({
  courseId,
  defaultCurrency,
  remainingBalance,
  onClose,
  onCreated,
}: {
  courseId: string;
  defaultCurrency: Currency;
  remainingBalance: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations("payments.course");
  const toast = useToast();
  const createMutation = useCreateTreatmentPayment(courseId);

  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [method, setMethod] = useState<PaymentMethod>("CARD");
  const [paidAt, setPaidAt] = useState(nowDateTime());
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const isOverpaying = amount > 0 && amount > remainingBalance;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!amount || amount <= 0) return toast.error(t("toast.amountRequired"));
    if (!paidAt) return toast.error(t("toast.paidAtRequired"));

    createMutation.mutate(
      {
        amount,
        currency,
        method,
        paidAt,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={fieldLabelClassName}>{t("createModal.amountLabel")}</label>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              allowDecimal
              placeholder="30"
              className={fieldClassName}
              autoFocus
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

        {isOverpaying && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
            {t("createModal.overpayWarning")}
          </p>
        )}

        <div>
          <label className={fieldLabelClassName}>{t("createModal.methodLabel")}</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className={fieldClassName}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {getMethodLabel(t, m)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabelClassName}>{t("createModal.paidAtLabel")}</label>
          <input
            type="datetime-local"
            value={toDateTimeInputValue(paidAt)}
            onChange={(e) => setPaidAt(fromDateTimeInputValue(e.target.value))}
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

        <div>
          <label className={fieldLabelClassName}>{t("createModal.noteLabel")}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("createModal.notePlaceholder")}
            rows={2}
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
// Void payment modal
// ---------------------------------------------------------------------------

function VoidPaymentModal({
  courseId,
  payment,
  onClose,
  onVoided,
}: {
  courseId: string;
  payment: TreatmentPayment;
  onClose: () => void;
  onVoided: () => void;
}) {
  const t = useTranslations("payments.course");
  const toast = useToast();
  const voidMutation = useVoidTreatmentPayment(courseId);

  const [reason, setReason] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return toast.error(t("toast.reasonRequired"));

    voidMutation.mutate(
      { paymentId: payment.id, payload: { reason: trimmed } },
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
// Invoice modal
// ---------------------------------------------------------------------------

function InvoiceModal({
  invoiceId,
  onClose,
}: {
  invoiceId: string;
  onClose: () => void;
}) {
  const t = useTranslations("payments.course");
  const toast = useToast();
  const { data: invoice, isLoading } = useGetInvoiceById(invoiceId);
  const downloadMutation = useDownloadInvoicePdf();

  function handleDownload() {
    if (!invoice) return;
    downloadMutation.mutate(
      { invoiceId: invoice.id, fileName: invoice.invoiceNumber },
      { onError: () => toast.error(t("toast.invoiceDownloadFailed")) }
    );
  }

  return (
    <ModalShell
      title={invoice ? t("invoice.modalTitle", { number: invoice.invoiceNumber }) : t("invoice.button")}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
    >
      <div className="max-h-[calc(92vh-190px)] space-y-5 overflow-y-auto px-6 py-6">
        {isLoading || !invoice ? (
          <LoadingState />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {t("invoice.patient")}
                </p>
                <p className="font-bold text-slate-900">{invoice.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {t("invoice.issuedAt")}
                </p>
                <p className="font-bold text-slate-900">{formatDateTimeDisplay(invoice.issuedAt)}</p>
              </div>
            </div>

            {invoice.diagnosis && (
              <p className="text-sm text-slate-600">
                <span className="font-black text-slate-400">{t("invoice.diagnosis")}: </span>
                {invoice.diagnosis}
              </p>
            )}

            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                {t("invoice.linesTitle")}
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t("invoice.table.date")}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t("invoice.table.procedure")}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t("invoice.table.tooth")}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">{t("invoice.table.unitPrice")}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">{t("invoice.table.lineTotal")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.lines.map((line, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                          {formatDateTimeDisplay(line.visitDate)}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{line.procedureName}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{line.toothNumber || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                          {formatPaymentMoney(line.unitPrice, invoice.currency)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-slate-900">
                          {formatPaymentMoney(line.lineTotal, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {invoice.paymentSnapshots.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {t("invoice.paymentsTitle")}
                </p>
                <div className="space-y-1.5">
                  {invoice.paymentSnapshots.map((snapshot, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-500">
                        {formatDateTimeDisplay(snapshot.paidAt)} · {getMethodLabel(t, snapshot.method)}
                        {snapshot.reference ? ` · ${snapshot.reference}` : ""}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatPaymentMoney(snapshot.amount, invoice.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400">{t("invoice.totals.totalAmount")}</p>
                <p className="font-black text-primary-blue">
                  {formatPaymentMoney(invoice.totalAmount, invoice.currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400">{t("invoice.totals.paidAtIssue")}</p>
                <p className="font-black text-slate-700">
                  {formatPaymentMoney(invoice.paidAmountAtIssue, invoice.currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400">
                  {t("invoice.totals.balanceAtIssue")}
                </p>
                <p className="font-black text-slate-700">
                  {formatPaymentMoney(invoice.balanceDueAtIssue, invoice.currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400">{t("invoice.totals.currentPaid")}</p>
                <p className="font-black text-emerald-600">
                  {formatPaymentMoney(invoice.currentPaidAmount, invoice.currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400">
                  {t("invoice.totals.currentBalance")}
                </p>
                <p className="font-black text-red-600">
                  {formatPaymentMoney(invoice.currentBalance, invoice.currency)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 sm:w-auto sm:px-5"
        >
          {t("invoice.close")}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!invoice?.pdfAvailable || downloadMutation.isPending}
          title={!invoice?.pdfAvailable ? t("invoice.pdfUnavailable") : undefined}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-blue py-2.5 text-sm font-bold text-white transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
        >
          <FileText size={16} />
          {downloadMutation.isPending ? t("invoice.downloading") : t("invoice.downloadPdf")}
        </button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function CoursePaymentsPanel({ courseId }: { courseId: string }) {
  const t = useTranslations("payments.course");
  const { data, isLoading, refetch } = useGetCoursePayments(courseId);
  const { data: invoice } = useGetInvoiceByCourse(courseId);

  const [addOpen, setAddOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<TreatmentPayment | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (isLoading) return <LoadingState />;

  const totalAmount = data?.totalAmount ?? 0;
  const paidAmount = data?.paidAmount ?? 0;
  const remainingBalance = data?.remainingBalance ?? 0;
  const currency = data?.currency ?? "UZS";
  const payments = data?.payments ?? [];
  const paidRatio = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
  const isFullyPaid = totalAmount > 0 && remainingBalance <= 0;

  return (
    <div>
      {/* Balance header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
        {invoice && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setInvoiceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-blue/30 bg-primary-blue/10 px-3 py-1.5 text-xs font-black text-primary-blue transition hover:bg-primary-blue/20"
            >
              <FileText size={13} />
              {t("invoice.button")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {t("balance.total")}
            </p>
            <p className="mt-1 text-lg font-black text-primary-blue">{formatPaymentMoney(totalAmount, currency)}</p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {t("balance.paid")}
            </p>
            <p className="mt-1 text-lg font-black text-emerald-600">
              {formatPaymentMoney(paidAmount, currency)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {t("balance.remaining")}
            </p>
            <p className="mt-1 text-xl font-black text-red-600">
              {formatPaymentMoney(remainingBalance, currency)}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${paidRatio}%` }}
          />
        </div>
      </div>

      {/* Add button */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={isFullyPaid}
          title={isFullyPaid ? t("fullyPaid") : undefined}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-blue px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-blue-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200"
        >
          <Plus size={16} />
          {t("addButton")}
        </button>
      </div>

      {isFullyPaid && (
        <p className="mt-2 text-right text-xs font-bold text-emerald-600">{t("fullyPaid")}</p>
      )}

      {/* Payments table */}
      <div className="mt-4">
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} message={t("table.empty")} />
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className={`rounded-2xl border p-3 ${
                  payment.voided ? "border-slate-100 bg-slate-50/60" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black ${
                        payment.voided
                          ? "bg-slate-200 text-slate-500"
                          : "bg-[#e0f2fe] text-[#0ea5e9]"
                      }`}
                    >
                      {getMethodLabel(t, payment.method)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {formatDateTimeDisplay(payment.paidAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={
                        payment.voided
                          ? "text-sm font-black text-slate-400 line-through"
                          : "text-sm font-black text-slate-900"
                      }
                    >
                      {formatPaymentMoney(payment.amount, payment.currency)}
                    </span>
                    {payment.voided ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600">
                        {t("status.voided")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setVoidTarget(payment)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                      >
                        <Ban size={13} />
                        {t("actions.void")}
                      </button>
                    )}
                  </div>
                </div>

                {(payment.reference || payment.note) && (
                  <p className="mt-2 truncate text-xs text-slate-500">
                    {[payment.reference, payment.note].filter(Boolean).join(" · ")}
                  </p>
                )}

                {payment.voided && (
                  <div className="mt-2 rounded-xl bg-red-50/60 px-3 py-2 text-xs text-red-700">
                    <p>
                      <span className="font-black">{t("voidedInfo.reason")}:</span> {payment.voidReason || "—"}
                    </p>
                    <p className="mt-0.5 text-red-500">
                      {t("voidedInfo.voidedAt")}: {formatDateTimeDisplay(payment.voidedAt)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <AddPaymentModal
          courseId={courseId}
          defaultCurrency={currency}
          remainingBalance={remainingBalance}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            refetch();
          }}
        />
      )}

      {voidTarget && (
        <VoidPaymentModal
          courseId={courseId}
          payment={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            setVoidTarget(null);
            refetch();
          }}
        />
      )}

      {invoiceOpen && invoice && (
        <InvoiceModal invoiceId={invoice.id} onClose={() => setInvoiceOpen(false)} />
      )}
    </div>
  );
}
