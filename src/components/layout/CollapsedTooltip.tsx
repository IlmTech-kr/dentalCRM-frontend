"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type TooltipPosition = { top: number; left: number };

/**
 * Sidebar `<aside>` `overflow-y-auto overflow-x-hidden` bilan chizilgan —
 * shu ichida `absolute` bilan joylashtirilgan tooltip kesib tashlanadi.
 * Shuning uchun `position: fixed` + `createPortal(document.body)`: viewport
 * koordinatalari (`getBoundingClientRect()`) fixed uchun to'g'ridan-to'g'ri
 * ishlaydi, scroll offsetini hisoblash shart emas.
 */
export default function CollapsedTooltip({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  function show() {
    if (disabled) return;
    // Sidebar faqat lg'da yig'iladi — touch/mobile'da tooltip kerak emas.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const el = wrapperRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    setPosition({ top: r.top + r.height / 2, left: r.right + 12 });
  }

  function hide() {
    setPosition(null);
  }

  return (
    <div ref={wrapperRef} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}

      {position &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[60] -translate-y-1/2 pointer-events-none rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-white shadow-lg ring-1 ring-white/10"
            style={{ top: position.top, left: position.left }}
          >
            {label}
            <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
          </div>,
          document.body
        )}
    </div>
  );
}
