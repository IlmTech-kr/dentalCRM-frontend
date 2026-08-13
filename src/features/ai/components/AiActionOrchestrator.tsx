"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Loader2,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  confirmAiAction,
  redraftAiAction,
} from "@/src/features/ai/ai.service";
import { getApiErrorMessage } from "@/src/lib/api/http";
import { useAiActionStore } from "@/src/store/ai-action.store";
import type { AiPendingAction } from "@/src/types/ai.types";

type JsonObject = Record<string, unknown>;
type JsonPath = Array<string | number>;

const FIELD_LABELS: Record<string, string> = {
  patientId: "Bemor ID",
  appointmentId: "Qabul ID",
  courseId: "Davolash kursi ID",
  visitId: "Tashrif ID",
  itemId: "Element ID",
  procedureId: "Muolaja ID",
  categoryId: "Kategoriya ID",
  recurringExpenseId: "Takroriy xarajat ID",
  expenseId: "Xarajat ID",
  paymentId: "To‘lov ID",
  firstName: "Ism",
  lastName: "Familiya",
  birthDate: "Tug‘ilgan sana",
  phone: "Telefon",
  gender: "Jins",
  anamnesis: "Anamnez",
  doctorId: "Shifokor ID",
  appointmentDate: "Qabul sanasi",
  startTime: "Boshlanish vaqti",
  slotDurationMinutes: "Davomiyligi (daqiqa)",
  status: "Holat",
  notes: "Izoh",
  doctorNotes: "Shifokor izohi",
  amount: "Summa",
  currency: "Valyuta",
  method: "To‘lov usuli",
  paidAt: "To‘langan vaqt/sana",
  reference: "Reference",
  note: "Izoh",
  expenseDate: "Xarajat sanasi",
  payeeName: "Qabul qiluvchi",
  description: "Tavsif",
  treatmentCourseId: "Davolash kursi ID",
  dayOfMonth: "Oy kuni",
  startDate: "Boshlanish sanasi",
  endDate: "Tugash sanasi",
  active: "Faol",
  name: "Nomi",
  kind: "Turi",
  code: "Kod",
  defaultPrice: "Standart narx",
  resultingCondition: "Natijaviy tish holati",
  mainDiagnosis: "Asosiy tashxis",
  visitDate: "Tashrif vaqti",
  items: "Davolash elementlari",
  toothNumber: "Tish raqami",
  price: "Narx",
  completed: "Bajarilgan",
  reason: "Tuzatish sababi",
};

const OPTIONS: Record<string, string[]> = {
  gender: ["MALE", "FEMALE", "OTHER"],
  status: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "PENDING", "PAID"],
  currency: ["UZS", "USD"],
  method: ["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "OTHER"],
  kind: ["TECHNICAL", "SUPPLIES", "OVERHEAD", "OTHER"],
  resultingCondition: [
    "HEALTHY",
    "CARIES",
    "EXTRACTED",
    "PULPITIS",
    "FILLING",
    "CROWN",
    "IMPLANT",
    "MISSING",
    "CRACK",
    "BRIDGE",
    "ROOT_CANAL",
    "GINGIVITIS",
  ],
};

const LONG_TEXT_FIELDS = new Set([
  "anamnesis",
  "notes",
  "doctorNotes",
  "note",
  "description",
  "reason",
  "appointmentNotes",
]);

export default function AiActionOrchestrator() {
  const action = useAiActionStore((state) => state.activeAction);

  if (!action) return null;

  return <AiActionSheet key={action.id} action={action} />;
}

function AiActionSheet({ action }: { action: AiPendingAction }) {
  const router = useRouter();
  const closeAction = useAiActionStore((state) => state.closeAction);
  const recordAction = useAiActionStore((state) => state.recordAction);
  const replaceWithRedraft = useAiActionStore(
    (state) => state.replaceWithRedraft
  );
  const [payload, setPayload] = useState<JsonObject>(() =>
    structuredClone(action.editablePayload)
  );
  const [voidReason, setVoidReason] = useState("");
  const [busy, setBusy] = useState<"redraft" | "confirm" | null>(null);
  const [error, setError] = useState("");

  const dirty = useMemo(
    () => JSON.stringify(payload) !== JSON.stringify(action.editablePayload),
    [action, payload]
  );

  const pending = action.status === "PENDING";
  const needsVoidReason = action.type.includes("VOID");

  async function redraft() {
    if (!dirty) return;
    setBusy("redraft");
    setError("");
    try {
      const replacement = await redraftAiAction(action.id, payload);
      replaceWithRedraft(action, replacement);
      router.push(replacement.targetRoute);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Yangi draft yaratilmadi."));
    } finally {
      setBusy(null);
    }
  }

  async function confirm() {
    if (dirty) {
      setError("Avval o‘zgartirilgan formadan yangi draft yarating.");
      return;
    }
    if (needsVoidReason && !voidReason.trim()) {
      setError("Void sababini kiriting. U audit tarixida saqlanadi.");
      return;
    }
    setBusy("confirm");
    setError("");
    try {
      recordAction(await confirmAiAction(action.id, voidReason));
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Action tasdiqlanmadi."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-action-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={closeAction}
        aria-label="AI action formasini yopish"
      />
      <section className="absolute inset-y-0 left-0 flex w-full max-w-[38rem] flex-col border-r border-slate-200 bg-[#f8fafb] shadow-[35px_0_90px_-55px_rgba(15,23,42,.75)] motion-safe:animate-[ai-action-drawer-in_.22s_cubic-bezier(.22,1,.36,1)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
              <ShieldCheck size={14} /> Safe action preview
            </p>
            <h2 id="ai-action-title" className="truncate text-lg font-semibold tracking-tight text-slate-950">
              {action.type.replaceAll("_", " ").toLowerCase()}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Version: {action.entityVersion ?? "new"} · {action.status}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAction}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="mb-5 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm leading-6 text-cyan-950">
            {action.preview}
          </div>

          <div className="space-y-4">
            {Object.entries(payload).map(([field, value]) => (
              <ActionField
                key={field}
                field={field}
                value={value}
                path={[field]}
                onChange={(path, nextValue) =>
                  setPayload((current) =>
                    updateAtPath(current, path, nextValue) as JsonObject
                  )
                }
                disabled={!pending || busy !== null}
              />
            ))}
          </div>

          {needsVoidReason && pending ? (
            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Admin void sababi
              </span>
              <textarea
                value={voidReason}
                onChange={(event) => setVoidReason(event.target.value)}
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          ) : null}

          {action.result ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <Check size={16} /> Amal bajarildi
              </p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] leading-5 text-emerald-800">
                {JSON.stringify(action.result, null, 2)}
              </pre>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAction}
              className="h-10 rounded-xl px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Yopish
            </button>
            {pending && dirty ? (
              <button
                type="button"
                onClick={() => void redraft()}
                disabled={busy !== null}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-700 px-4 text-xs font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-50"
              >
                {busy === "redraft" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RotateCcw size={15} />
                )}
                Yangi draft
              </button>
            ) : null}
            {pending && !dirty ? (
              <button
                type="button"
                onClick={() => void confirm()}
                disabled={busy !== null}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {busy === "confirm" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ChevronRight size={15} />
                )}
                Confirm
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-right text-[10px] leading-4 text-slate-400">
            Formadagi o‘zgarish eski draftni bajarmaydi — yangi immutable preview yaratiladi.
          </p>
        </footer>
      </section>
    </div>
  );
}

function ActionField({
  field,
  value,
  path,
  onChange,
  disabled,
}: {
  field: string;
  value: unknown;
  path: JsonPath;
  onChange: (path: JsonPath, value: unknown) => void;
  disabled: boolean;
}) {
  const label = FIELD_LABELS[field] || humanize(field);

  if (Array.isArray(value)) {
    return (
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-xs font-semibold text-slate-700">{label}</legend>
        <div className="space-y-4">
          {value.map((item, index) => (
            <div key={`${field}-${index}`} className="rounded-xl bg-slate-50 p-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                #{index + 1}
              </p>
              {isObject(item) ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(item).map(([childField, childValue]) => (
                    <ActionField
                      key={childField}
                      field={childField}
                      value={childValue}
                      path={[...path, index, childField]}
                      onChange={onChange}
                      disabled={disabled}
                    />
                  ))}
                </div>
              ) : (
                <ActionField
                  field={`${field} ${index + 1}`}
                  value={item}
                  path={[...path, index]}
                  onChange={onChange}
                  disabled={disabled}
                />
              )}
            </div>
          ))}
        </div>
      </fieldset>
    );
  }

  if (isObject(value)) {
    return (
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-xs font-semibold text-slate-700">{label}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(value).map(([childField, childValue]) => (
            <ActionField
              key={childField}
              field={childField}
              value={childValue}
              path={[...path, childField]}
              onChange={onChange}
              disabled={disabled}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(path, event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 accent-cyan-700"
        />
      </label>
    );
  }

  const options = OPTIONS[field];
  const stringValue = value == null ? "" : String(value);
  const inputType = resolveInputType(field, value);
  const controlClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500";

  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      {options ? (
        <select
          value={stringValue}
          onChange={(event) => onChange(path, event.target.value)}
          disabled={disabled}
          className={controlClass}
        >
          <option value="">Tanlang</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : LONG_TEXT_FIELDS.has(field) ? (
        <textarea
          value={stringValue}
          onChange={(event) => onChange(path, event.target.value)}
          disabled={disabled}
          rows={3}
          maxLength={1000}
          className={`${controlClass} resize-y`}
        />
      ) : (
        <input
          type={inputType}
          value={stringValue}
          onChange={(event) =>
            onChange(
              path,
              inputType === "number"
                ? event.target.value === ""
                  ? null
                  : Number(event.target.value)
                : event.target.value
            )
          }
          disabled={disabled}
          step={inputType === "number" ? "any" : undefined}
          className={controlClass}
        />
      )}
    </label>
  );
}

function updateAtPath(value: unknown, path: JsonPath, nextValue: unknown): unknown {
  if (path.length === 0) return nextValue;
  const [head, ...tail] = path;
  if (Array.isArray(value)) {
    const copy = [...value];
    const index = Number(head);
    copy[index] = updateAtPath(copy[index], tail, nextValue);
    return copy;
  }
  const object = isObject(value) ? value : {};
  return {
    ...object,
    [String(head)]: updateAtPath(object[String(head)], tail, nextValue),
  };
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveInputType(field: string, value: unknown): string {
  if (typeof value === "number") return "number";
  if (field === "birthDate" || field === "appointmentDate" || field === "expenseDate" || field === "startDate" || field === "endDate") return "date";
  if (field === "startTime") return "time";
  if (field === "paidAt" || field === "visitDate") return "datetime-local";
  if (field === "phone") return "tel";
  return "text";
}

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
