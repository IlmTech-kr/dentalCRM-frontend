"use client";

import { AiWorkspace } from "@/src/features/ai/components/AiWorkspace";
import { useUiStore } from "@/src/store/ui.store";

export default function AiDrawer() {
  const close = useUiStore((state) => state.setAiDrawerOpen);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Dental AI Copilot">
      <button type="button" aria-label="AI Copilotni yopish" onClick={() => close(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" />
      <div className="absolute inset-y-0 right-0 w-full max-w-[42rem] border-l border-slate-200 bg-[#f7f9fa] shadow-[-30px_0_80px_-50px_rgba(15,23,42,.7)] motion-safe:animate-[ai-drawer-in_.24s_cubic-bezier(.22,1,.36,1)]">
        <AiWorkspace compact onClose={() => close(false)} />
      </div>
    </div>
  );
}
