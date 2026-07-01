"use client";

/**
 * File: src/components/ui/DentalLoader.tsx
 *
 * Usage:
 * <DentalLoader />
 * <DentalLoader text="Saving..." />
 * <DentalLoader fullScreen />
 */

interface DentalLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export default function DentalLoader({
  text = "Loading...",
  fullScreen = true,
}: DentalLoaderProps) {
  const wrapper = fullScreen
    ? "flex h-screen w-full items-center justify-center bg-light-background"
    : "flex w-full items-center justify-center py-16";

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-5">
        <svg
          width="120"
          height="90"
          viewBox="0 0 120 90"
          role="img"
          aria-label={text}
        >
          <title>{text}</title>

          <style>{`
            @keyframes pulse-tooth {
              0%, 100% { transform: scaleY(1); opacity: 1; }
              50% { transform: scaleY(0.85); opacity: 0.55; }
            }
            @keyframes shimmer {
              0% { stroke-dashoffset: 200; opacity: 0; }
              20% { opacity: 1; }
              100% { stroke-dashoffset: 0; opacity: 0; }
            }
            @keyframes bg-glow {
              0%, 100% { opacity: 0.12; }
              50% { opacity: 0.35; }
            }
            .dl-t1 { animation: pulse-tooth 1.4s ease-in-out 0s infinite; transform-origin: 24px 72px; }
            .dl-t2 { animation: pulse-tooth 1.4s ease-in-out 0.2s infinite; transform-origin: 52px 72px; }
            .dl-t3 { animation: pulse-tooth 1.4s ease-in-out 0.4s infinite; transform-origin: 75px 72px; }
            .dl-t4 { animation: pulse-tooth 1.4s ease-in-out 0.6s infinite; transform-origin: 96px 72px; }
            .dl-shine { stroke-dasharray: 200; animation: shimmer 2s ease-in-out infinite; }
            .dl-glow { animation: bg-glow 1.4s ease-in-out infinite; }
          `}</style>

          {/* Background glow */}
          <ellipse
            className="dl-glow"
            cx="60" cy="56" rx="50" ry="30"
            fill="#35a8f5"
          />

          {/* Tooth 1 — molar left */}
          <g className="dl-t1">
            <path
              d="M10 72 C10 72 7 69 7 59 C7 49 11 43 15 41 C17 40 19 41 21 43 C23 41 25 40 27 41 C31 43 35 49 35 59 C35 69 31 72 31 72 Z"
              fill="white" stroke="#35a8f5" strokeWidth="1.5"
            />
            <line x1="21" y1="43" x2="21" y2="55" stroke="#35a8f5" strokeWidth="1" opacity="0.4"/>
            <path className="dl-shine" d="M11 52 Q16 45 22 47" fill="none" stroke="#35a8f5" strokeWidth="1.5" strokeLinecap="round"/>
          </g>

          {/* Tooth 2 — incisor */}
          <g className="dl-t2">
            <path
              d="M39 72 C39 72 36 68 36 54 C36 43 40 37 44 36 C46 35.5 48 36.5 49 38 C50 36.5 52 35.5 54 36 C58 37 62 43 62 54 C62 68 59 72 59 72 Z"
              fill="white" stroke="#35a8f5" strokeWidth="1.5"
            />
            <path className="dl-shine" d="M38 49 Q44 41 51 44" fill="none" stroke="#35a8f5" strokeWidth="1.5" strokeLinecap="round"/>
          </g>

          {/* Tooth 3 — canine */}
          <g className="dl-t3">
            <path
              d="M65 72 C65 72 62 68 62 55 C62 45 65 40 68 39 C70 38.5 71.5 40 72 42 C72.5 40 74 38.5 76 39 C79 40 82 45 82 55 C82 68 79 72 79 72 Z"
              fill="white" stroke="#35a8f5" strokeWidth="1.5"
            />
            <path className="dl-shine" d="M64 51 Q69 43 75 46" fill="none" stroke="#35a8f5" strokeWidth="1.5" strokeLinecap="round"/>
          </g>

          {/* Tooth 4 — molar right */}
          <g className="dl-t4">
            <path
              d="M85 72 C85 72 82 69 82 59 C82 49 85 43 89 41 C91 40 93 41 95 43 C97 41 99 40 101 41 C105 43 109 49 109 59 C109 69 105 72 105 72 Z"
              fill="white" stroke="#35a8f5" strokeWidth="1.5"
            />
            <line x1="95" y1="43" x2="95" y2="55" stroke="#35a8f5" strokeWidth="1" opacity="0.4"/>
            <path className="dl-shine" d="M84 52 Q90 45 96 47" fill="none" stroke="#35a8f5" strokeWidth="1.5" strokeLinecap="round"/>
          </g>

          {/* Gum line */}
          <path
            d="M5 76 Q30 81 60 80 Q90 79 115 76"
            fill="none" stroke="#94c8f0" strokeWidth="1.5" strokeLinecap="round"
          />
        </svg>

        {/* Bouncing dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#35a8f5",
                animation: `dl-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes dl-dot {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
            40% { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>

        <p className="text-sm font-medium text-slate-400">{text}</p>
      </div>
    </div>
  );
}