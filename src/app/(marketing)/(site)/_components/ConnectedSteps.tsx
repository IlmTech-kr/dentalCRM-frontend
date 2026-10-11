"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* ── Timeline ──────────────────────────────────────────────── */

/* Each step waits for the connector from the previous one to arrive. */
const STEP_INTERVAL_MS = 520;
const TEXT_LAG_MS = 120;
const CONNECTOR_LAG_MS = 260;

type Step = {
  title: string;
  desc: string;
};

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/* ── Component ─────────────────────────────────────────────── */

/**
 * A numbered sequence joined by connectors. When it scrolls into view the
 * steps appear one by one, each connector drawing out to the next step.
 * Runs down the page on small screens and across it from `lg`.
 */
export default function ConnectedSteps({ steps }: { steps: Step[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        io.disconnect();
      },
      { threshold: 0.3 }
    );
    io.observe(list);

    return () => io.disconnect();
  }, []);

  const timing =
    "transition-[opacity,scale,translate] duration-500 ease-out delay-[var(--d)] motion-reduce:delay-0";

  return (
    <ol ref={listRef} className="grid max-w-xl lg:max-w-none lg:grid-cols-4">
      {steps.map((step, i) => {
        const start = i * STEP_INTERVAL_MS;
        const last = i === steps.length - 1;

        return (
          <li
            key={step.title}
            className={`relative pl-16 lg:pl-0 lg:pr-8 ${last ? "" : "pb-10 lg:pb-0"}`}
          >
            {/* Connector to the next step */}
            {!last && (
              <span
                aria-hidden
                style={delay(start + CONNECTOR_LAG_MS)}
                className={`absolute bottom-1.5 left-[21px] top-[50px] w-0.5 origin-top rounded-full bg-gradient-to-b from-violet-600 to-violet-300 lg:bottom-auto lg:left-[50px] lg:right-1.5 lg:top-[21px] lg:h-0.5 lg:w-auto lg:origin-left lg:bg-gradient-to-r ${timing} ${
                  revealed ? "scale-100" : "scale-y-0 lg:scale-x-0 lg:scale-y-100"
                }`}
              />
            )}

            {/* Node */}
            <span
              style={delay(start)}
              className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border-2 border-violet-600 bg-white text-base font-semibold text-violet-700 lg:static ${timing} ${
                revealed ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            >
              {i + 1}
            </span>

            <div
              style={delay(start + TEXT_LAG_MS)}
              className={`pt-2 lg:pt-6 ${timing} ${
                revealed ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              <h3 className="text-lg font-semibold tracking-[-0.01em] text-[#07105f]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
