"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import { AiActionCard } from "@/src/features/ai/components/AiActionCard";
import { AiMarkdown } from "@/src/features/ai/components/AiMarkdown";
import type { AiChatMessage, AiPendingAction } from "@/src/types/ai.types";

export function AiMessageItem({
  message,
  onActionChange,
}: {
  message: AiChatMessage;
  onActionChange: (action: AiPendingAction) => void;
}) {
  const [copied, setCopied] = useState(false);
  const assistant = message.role === "ASSISTANT";

  async function copy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (!assistant) {
    return (
      <article className="flex justify-end py-3">
        <div className="max-w-[86%] rounded-[22px] rounded-br-md bg-slate-900 px-4 py-3 text-[14px] leading-6 text-white shadow-[0_10px_30px_-18px_rgba(15,23,42,.75)] sm:max-w-[72%] sm:px-5">
          <p className="whitespace-pre-wrap text-pretty">{message.content}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="group grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[38px_minmax(0,1fr)] sm:gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-[0_8px_22px_-12px_rgba(14,116,144,.8)] sm:h-9 sm:w-9">
        <Sparkles size={17} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 pt-0.5">
        {message.content ? <AiMarkdown content={message.content} /> : (
          <div className="flex h-7 items-center gap-1.5" aria-label="AI javob tayyorlamoqda">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-600" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-600 [animation-delay:140ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-600 [animation-delay:280ms]" />
          </div>
        )}
        {message.streaming && message.content ? <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-cyan-600 align-middle" aria-hidden="true" /> : null}
        {message.failed ? <p className="mt-2 text-xs font-medium text-red-600">Ulanish uzildi. Xabarni qayta yuborishingiz mumkin.</p> : null}

        {message.pendingActions.map((action) => (
          <AiActionCard key={action.id} action={action} onChange={onActionChange} />
        ))}

        {message.sources.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-medium text-slate-400">Manbalar</span>
            {message.sources.map((source) => (
              <span key={`${source.sectionId}-${source.version}`} title={`Til: ${source.language}`} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                {source.title} · v{source.version}
              </span>
            ))}
          </div>
        ) : null}

        {message.content && !message.streaming ? (
          <button type="button" onClick={copy} className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-slate-400 opacity-100 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:opacity-0 sm:group-hover:opacity-100">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Nusxalandi" : "Nusxalash"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
