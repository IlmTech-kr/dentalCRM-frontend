"use client";

import { ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { AiWorkspace } from "@/src/features/ai/components/AiWorkspace";
import { useUiStore } from "@/src/store/ui.store";

export default function AiDrawer() {
  const close = useUiStore((state) => state.setAiDrawerOpen);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Dental AI Copilot">
      <button type="button" aria-label="AI Copilotni yopish" onClick={() => close(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" />
      <div className="absolute inset-y-0 right-0 w-full max-w-[42rem] border-l border-slate-200 bg-[#f7f9fa] shadow-[-30px_0_80px_-50px_rgba(15,23,42,.7)] motion-safe:animate-[ai-drawer-in_.24s_cubic-bezier(.22,1,.36,1)]">
        <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5">
          <Link href="/ai" onClick={() => close(false)} className="flex h-9 items-center gap-2 rounded-xl bg-white/90 px-3 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"><ExternalLink size={14} /> To‘liq sahifa</Link>
          <button type="button" onClick={() => close(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600" aria-label="Yopish"><X size={17} /></button>
        </div>
        <AiWorkspace compact />
      </div>
    </div>
  );
}
