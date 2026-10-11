import { Check, ShieldCheck, Stethoscope, UserRound } from "lucide-react";

/* Small drawn previews of each feature, in the order of `features.items`.
 * They are pictures, not UI: no translatable text, hidden from readers. */

const BAR = "h-1.5 rounded-full bg-[#07105f]/15";

/* ── Patients ──────────────────────────────────────────────── */

function PatientsArt() {
  const rows = [
    { tint: "bg-sky-400", name: "w-20", meta: "w-12", active: true },
    { tint: "bg-violet-400", name: "w-16", meta: "w-14", active: false },
    { tint: "bg-rose-400", name: "w-24", meta: "w-10", active: false },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-2 px-5">
      {rows.map((row, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
            row.active ? "bg-white ring-1 ring-violet-500/40" : ""
          }`}
        >
          <span className={`h-7 w-7 shrink-0 rounded-full ${row.tint}`} />
          <span className="flex-1 space-y-1.5">
            <span className={`block ${BAR} ${row.name} bg-[#07105f]/30`} />
            <span className={`block ${BAR} ${row.meta}`} />
          </span>
          {row.active && <span className="h-2 w-2 rounded-full bg-violet-600" />}
        </div>
      ))}
    </div>
  );
}

/* ── Schedule ──────────────────────────────────────────────── */

function ScheduleArt() {
  /* [day column 0-4, top %, height %, colour] */
  const visits: [number, number, number, string][] = [
    [0, 6, 30, "bg-sky-400"],
    [0, 58, 24, "bg-violet-300"],
    [1, 26, 40, "bg-violet-500"],
    [2, 6, 22, "bg-rose-400"],
    [2, 46, 34, "bg-sky-300"],
    [3, 34, 28, "bg-violet-400"],
    [4, 10, 46, "bg-sky-500"],
    [4, 68, 20, "bg-rose-300"],
  ];

  return (
    <div className="flex h-full gap-3 px-5 py-5">
      <div className="flex flex-col justify-between py-0.5 text-[10px] font-medium leading-none text-[#07105f]/45">
        <span>09:00</span>
        <span>12:00</span>
        <span>15:00</span>
        <span>18:00</span>
      </div>
      <div className="grid flex-1 grid-cols-5 gap-1.5">
        {[0, 1, 2, 3, 4].map((day) => (
          <div key={day} className="relative rounded-lg bg-white/70">
            {visits
              .filter(([d]) => d === day)
              .map(([, top, height, tint], i) => (
                <span
                  key={i}
                  style={{ top: `${top}%`, height: `${height}%` }}
                  className={`absolute inset-x-1 rounded-md ${tint}`}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Staff roles ───────────────────────────────────────────── */

function RolesArt() {
  const roles = [
    { Icon: Stethoscope, access: [true, true, false] },
    { Icon: UserRound, access: [true, false, false] },
    { Icon: ShieldCheck, access: [true, true, true] },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-3 px-6">
      {roles.map(({ Icon, access }, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-violet-700">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className={`${BAR} flex-1`} />
          <span className="flex gap-1">
            {access.map((on, j) => (
              <span
                key={j}
                className={`flex h-4 w-7 items-center rounded-full px-0.5 ${
                  on ? "justify-end bg-violet-600" : "justify-start bg-[#07105f]/15"
                }`}
              >
                <span className="h-3 w-3 rounded-full bg-white" />
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Dental chart ──────────────────────────────────────────── */

/* Upper arch in FDI notation, right to left as the dentist sees it. */
const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];

const TOOTH_MARKS: Record<number, string> = {
  16: "border-violet-600 bg-violet-600",
  13: "border-sky-500 bg-sky-100",
  24: "border-rose-500 bg-rose-500",
  27: "border-violet-600 bg-violet-200",
};

function ChartArt() {
  return (
    <div className="flex h-full items-center px-4 sm:px-6">
      <div className="flex w-full gap-1">
        {UPPER_ARCH.map((tooth, i) => {
          /* Molars are broad, incisors narrow and long. */
          const fromCentre = Math.abs(i - 7.5);
          const height = 68 - fromCentre * 3;

          return (
            <div
              key={tooth}
              className={`flex flex-1 flex-col items-center gap-1.5 ${
                i === 8 ? "ml-1.5" : ""
              }`}
            >
              {/* Fixed-height slot keeps the numbers on one line. */}
              <span className="flex h-[68px] w-full items-start">
                <span
                  style={{ height }}
                  className={`w-full rounded-b-[45%] rounded-t-md border-[1.5px] ${
                    TOOTH_MARKS[tooth] ?? "border-[#07105f]/25 bg-white"
                  }`}
                />
              </span>
              <span className="text-[9px] font-medium leading-none text-[#07105f]/50">
                {tooth}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Treatment course ──────────────────────────────────────── */

function CourseArt() {
  const visits = [
    { done: true, width: "w-24" },
    { done: true, width: "w-16" },
    { done: false, width: "w-20" },
  ];

  return (
    <div className="relative flex h-full flex-col justify-center gap-3.5 px-6">
      <span
        aria-hidden
        className="absolute bottom-10 left-[33px] top-10 w-0.5 bg-[#07105f]/15"
      />
      {visits.map((visit, i) => (
        <div key={i} className="relative flex items-center gap-3">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              visit.done
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-[#07105f]/25 bg-[#eef1f6]"
            }`}
          >
            {visit.done && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          <span
            className={`${BAR} ${visit.width} ${visit.done ? "bg-[#07105f]/30" : ""}`}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Payments and debt ─────────────────────────────────────── */

function PaymentsArt() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 px-6">
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold leading-none tracking-[-0.03em] text-[#07105f]">
          72%
        </span>
        <span className="text-xs font-medium leading-none text-rose-600">28%</span>
      </div>
      <div className="flex h-3 gap-1">
        <span className="w-[72%] rounded-full bg-violet-600" />
        <span className="flex-1 rounded-full bg-rose-400" />
      </div>
      <div className="space-y-2">
        <span className={`block ${BAR} w-28`} />
        <span className={`block ${BAR} w-16`} />
      </div>
    </div>
  );
}

/* ── Reports ───────────────────────────────────────────────── */

function ReportsArt() {
  const months = [34, 46, 40, 58, 52, 66, 60, 74, 70, 86, 80, 100];

  return (
    <div className="flex h-full items-end gap-1.5 px-6 pb-5 pt-6 sm:gap-2">
      {months.map((value, i) => (
        <span
          key={i}
          style={{ height: `${value}%` }}
          className={`flex-1 rounded-t-md ${
            i === months.length - 1
              ? "bg-gradient-to-t from-violet-600 to-sky-400"
              : "bg-[#07105f]/15"
          }`}
        />
      ))}
    </div>
  );
}

/* ── One clinic, one space ─────────────────────────────────── */

function TenantsArt() {
  const clinics = [
    { host: "clinic1", tint: "bg-sky-400" },
    { host: "clinic2", tint: "bg-violet-500" },
    { host: "clinic3", tint: "bg-rose-400" },
  ];

  return (
    <div className="grid h-full grid-cols-3 gap-2.5 px-5 py-5">
      {clinics.map((clinic) => (
        <div key={clinic.host} className="flex flex-col overflow-hidden rounded-xl bg-white">
          <div className="flex items-center gap-1.5 border-b border-[#07105f]/10 px-2.5 py-2">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${clinic.tint}`} />
            <span className="truncate text-[10px] font-medium leading-none text-[#07105f]/60">
              {clinic.host}
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1.5 px-2.5">
            <span className={`block h-4 w-4 rounded-md ${clinic.tint}`} />
            <span className={`block ${BAR} w-full`} />
            <span className={`block ${BAR} w-2/3`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Export ────────────────────────────────────────────────── */

const ART = [
  PatientsArt,
  ScheduleArt,
  RolesArt,
  ChartArt,
  CourseArt,
  PaymentsArt,
  ReportsArt,
  TenantsArt,
];

/** Features whose preview needs the room of two columns. */
export const WIDE_FEATURES = new Set([1, 3, 6, 7]);

export default function FeatureArt({ index }: { index: number }) {
  const Art = ART[index];
  if (!Art) return null;

  return (
    <div aria-hidden className="h-40 overflow-hidden rounded-2xl bg-[#eef1f6]">
      <Art />
    </div>
  );
}
