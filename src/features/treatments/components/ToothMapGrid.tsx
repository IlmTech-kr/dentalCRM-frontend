"use client";

import { Trash2 } from "lucide-react";
import type { ToothMap } from "@/src/types/treatment.types";

type Props = {
  toothMap: ToothMap;
  onRemoveTooth: (tooth: string) => void;
};

export function ToothMapGrid({ toothMap, onRemoveTooth }: Props) {
  const teeth = Object.entries(toothMap);

  if (teeth.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <div>
          <h3 className="font-black text-slate-900">Tish holati yo‘q</h3>
          <p className="mt-1 text-sm text-slate-500">
            Chap tomondan tish holatini kiriting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {teeth.map(([tooth, data]) => (
        <div
          key={tooth}
          className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-700">
                {tooth}
              </div>

              <div>
                <p className="font-black text-slate-900">Tish #{tooth}</p>
                <p className="text-xs font-bold text-slate-400">
                  Current condition
                </p>
              </div>
            </div>

            <button
              onClick={() => onRemoveTooth(tooth)}
              className="rounded-2xl bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <InfoGroup label="Diagnosis">
            {data.diagnoses.length > 0 ? (
              data.diagnoses.map((item) => (
                <Badge key={item} color="orange">
                  {item}
                </Badge>
              ))
            ) : (
              <EmptyText />
            )}
          </InfoGroup>

          <div className="mt-4">
            <InfoGroup label="State">
              {data.states.length > 0 ? (
                data.states.map((item) => (
                  <Badge key={item} color="blue">
                    {item}
                  </Badge>
                ))
              ) : (
                <EmptyText />
              )}
            </InfoGroup>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
              Doctor note
            </p>
            <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {data.note || "Note yo‘q"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "blue" | "orange";
}) {
  const className =
    color === "blue"
      ? "bg-blue-50 text-blue-700"
      : "bg-orange-50 text-orange-700";

  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-black ${className}`}>
      {children}
    </span>
  );
}

function EmptyText() {
  return <span className="text-sm font-medium text-slate-400">Yo‘q</span>;
}