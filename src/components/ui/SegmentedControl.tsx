"use client";

/**
 * Umumiy segmented control — dashboard'dagi Overview/Course Payments
 * tab'lari va boshqa joylarda bir xil vizual tilni ulashadi.
 */
export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-xl border border-border-color bg-slate-50 p-1"
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          aria-pressed={value === opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 ${
            value === opt.key
              ? "bg-white text-primary-blue-dark shadow-sm"
              : "text-text-light hover:text-dark-navy"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
