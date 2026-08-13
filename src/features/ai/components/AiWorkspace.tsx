"use client";

import {
  ArrowUp,
  Bot,
  Clock3,
  History,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Square,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiMessageItem } from "@/src/features/ai/components/AiMessageItem";
import {
  createAiSession,
  getAiHistory,
  listAiSessions,
  streamAiMessage,
} from "@/src/features/ai/ai.service";
import { getApiErrorMessage } from "@/src/lib/api/http";
import { useLocaleStore } from "@/src/store/locale.store";
import type {
  AiChatMessage,
  AiChatSession,
  AiPendingAction,
  AiStreamError,
} from "@/src/types/ai.types";
import { useAiActionStore } from "@/src/store/ai-action.store";

const AI_TARGET_ROUTES = new Set([
  "/patients",
  "/appointments",
  "/expenses/payments",
  "/expenses",
  "/expenses/recurring",
  "/expenses/categories",
  "/procedures",
  "/treatments",
]);

const SUGGESTIONS = [
  "Bugungi appointmentlar va bemorlarni ko‘rsat",
  "Oxirgi 6 oylik UZS daromadni oylar bo‘yicha tahlil qil",
  "Bugungi to‘lovlar tarixini patient va course bilan ko‘rsat",
  "Shu oydagi paid xarajatlar va recurring expense’larni solishtir",
];

function temporaryMessage(id: string, role: "USER" | "ASSISTANT", content: string): AiChatMessage {
  return {
    id,
    role,
    content,
    sources: [],
    pendingActions: [],
    createdAt: new Date().toISOString(),
    streaming: role === "ASSISTANT",
  };
}

export function AiWorkspace({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const openAction = useAiActionStore((state) => state.openAction);
  const locale = useLocaleStore((state) => state.locale);
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(!compact);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const tempIdRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const list = await listAiSessions();
        if (!active) return;
        setSessions(list);
        if (list[0]) {
          const history = await getAiHistory(list[0].id);
          if (!active) return;
          setActiveSessionId(list[0].id);
          setMessages(history);
        }
      } catch (cause) {
        if (active) setError(getApiErrorMessage(cause, "Chat tarixi yuklanmadi."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth", block: "end" });
  }, [messages, streaming]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, compact ? 132 : 168)}px`;
  }, [input, compact]);

  async function selectSession(sessionId: string) {
    if (streaming || sessionId === activeSessionId) return;
    setError("");
    setLoading(true);
    try {
      setMessages(await getAiHistory(sessionId));
      setActiveSessionId(sessionId);
      if (compact) setHistoryOpen(false);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Chat tarixi yuklanmadi."));
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    if (streaming) return;
    setActiveSessionId(null);
    setMessages([]);
    setError("");
    setInput("");
    textareaRef.current?.focus();
    if (compact) setHistoryOpen(false);
  }

  async function send(forcedText?: string) {
    const outgoing = (forcedText ?? input).trim();
    if (!outgoing || streaming) return;

    setInput("");
    setError("");
    setStreaming(true);
    const stamp = ++tempIdRef.current;
    const userTempId = `temp-user-${stamp}`;
    const assistantTempId = `temp-assistant-${stamp}`;
    setMessages((previous) => [
      ...previous,
      temporaryMessage(userTempId, "USER", outgoing),
      temporaryMessage(assistantTempId, "ASSISTANT", ""),
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const created = await createAiSession(outgoing.slice(0, 80));
        sessionId = created.id;
        setActiveSessionId(created.id);
        setSessions((previous) => [created, ...previous]);
      }

      await streamAiMessage(
        sessionId,
        outgoing,
        locale,
        {
          onToken: (content) => {
            if (!content) return;
            setMessages((previous) => previous.map((message) =>
              message.id === assistantTempId
                ? { ...message, content: message.content + content }
                : message
            ));
          },
          onDone: (reply) => {
            setMessages((previous) => previous.map((message) => {
              if (message.id === userTempId) return reply.userMessage;
              if (message.id === assistantTempId) return reply.assistantMessage;
              return message;
            }));
            setSessions((previous) => previous.map((session) =>
              session.id === sessionId
                ? { ...session, title: session.title === "New AI conversation" ? outgoing.slice(0, 80) : session.title, lastMessageAt: new Date().toISOString() }
                : session
            ).toSorted((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt)));
          },
          onActionPreview: (action) => {
            openAction(action);
            setMessages((previous) => previous.map((message) =>
              message.id === assistantTempId
                ? {
                    ...message,
                    pendingActions: message.pendingActions.some(
                      (item) => item.id === action.id
                    )
                      ? message.pendingActions
                      : [...message.pendingActions, action],
                  }
                : message
            ));
          },
          onUiCommand: (command) => {
            if (
              command.type === "NAVIGATE_AND_PREFILL" &&
              AI_TARGET_ROUTES.has(command.targetRoute)
            ) {
              router.push(command.targetRoute);
            }
          },
          onError: (streamError) => handleStreamError(streamError, assistantTempId),
        },
        controller.signal
      );
    } catch (cause) {
      if ((cause as { name?: string })?.name !== "AbortError") {
        handleStreamError({
          code: "STREAM_FAILED",
          message: getApiErrorMessage(cause, "AI bilan ulanish uzildi."),
          retryable: true,
        }, assistantTempId);
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setMessages((previous) => previous.map((message) =>
        message.id === assistantTempId ? { ...message, streaming: false } : message
      ));
      window.requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function handleStreamError(streamError: AiStreamError, assistantId: string) {
    setError(streamError.message);
    setMessages((previous) => previous.map((message) =>
      message.id === assistantId
        ? {
            ...message,
            content: message.content || `Javob berishda muammo yuz berdi: ${streamError.message}`,
            streaming: false,
            failed: true,
          }
        : message
    ));
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function updateAction(action: AiPendingAction) {
    useAiActionStore.getState().recordAction(action);
    setMessages((previous) => previous.map((message) => ({
      ...message,
      pendingActions: message.pendingActions.map((item) => item.id === action.id ? action : item),
    })));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <section className={`relative flex min-h-0 overflow-hidden bg-[#f7f9fa] font-sans ${compact ? "h-full" : "h-[calc(100dvh-8rem)] min-h-[38rem] rounded-[28px] border border-slate-200/80 shadow-[0_30px_90px_-55px_rgba(15,23,42,.45)]"}`}>
      {historyOpen ? (
        <aside className={`${compact ? "absolute inset-y-0 left-0 z-20 w-[82%] max-w-[19rem] shadow-2xl" : "w-64 shrink-0"} flex flex-col border-r border-slate-200 bg-[#eef2f3] p-3`}>
          <div className="flex items-center justify-between px-2 pb-3 pt-1">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><History size={15} /> Chat tarixi</span>
            <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600" aria-label="Tarix panelini yopish"><PanelLeftClose size={16} /></button>
          </div>
          <button type="button" onClick={newConversation} disabled={streaming} className="mb-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-xs font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-50">
            <MessageSquarePlus size={15} /> Yangi suhbat
          </button>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="AI chat sessions">
            {sessions.map((session) => (
              <button key={session.id} type="button" onClick={() => void selectSession(session.id)} disabled={streaming} className={`w-full rounded-xl px-3 py-2.5 text-left transition ${activeSessionId === session.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white hover:text-slate-950"}`}>
                <span className="block truncate text-xs font-medium">{session.title}</span>
                <span className={`mt-1 flex items-center gap-1 text-[10px] ${activeSessionId === session.id ? "text-slate-400" : "text-slate-400"}`}><Clock3 size={10} /> {formatSessionDate(session.lastMessageAt, locale)}</span>
              </button>
            ))}
          </nav>
          {compact ? <Link href="/ai" className="mt-3 rounded-xl px-3 py-2 text-center text-xs font-semibold text-cyan-800 transition hover:bg-white">To‘liq chat sahifasi</Link> : null}
        </aside>
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {!historyOpen ? <button type="button" onClick={() => setHistoryOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600" aria-label="Chat tarixini ochish"><PanelLeftOpen size={17} /></button> : null}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-700 text-white"><Bot size={18} /></div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight text-slate-950">Dental Copilot</h1>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Clinic ma’lumotlari bilan ishlaydi</p>
            </div>
          </div>
          {!compact ? <span className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex"><Stethoscope size={13} /> Klinik qarorlarni shifokor tasdiqlaydi</span> : null}
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className={`mx-auto flex min-h-full max-w-3xl flex-col px-4 pb-44 pt-5 sm:px-7 ${compact ? "" : "lg:px-8"}`}>
            {loading ? <ConversationSkeleton /> : messages.length === 0 ? (
              <Welcome onSuggestion={(suggestion) => void send(suggestion)} compact={compact} />
            ) : (
              <div>
                {messages.map((message) => <AiMessageItem key={message.id} message={message} onActionChange={updateAction} />)}
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#f7f9fa] via-[#f7f9fa] to-transparent px-3 pb-3 pt-12 sm:px-6 sm:pb-5">
          <div className="pointer-events-auto mx-auto max-w-3xl">
            {error ? <p role="alert" className="mb-2 px-2 text-xs font-medium text-red-600">{error}</p> : null}
            <div className="rounded-[22px] border border-slate-300 bg-white p-2 shadow-[0_18px_55px_-26px_rgba(15,23,42,.45)] transition focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-100/70">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={4000}
                disabled={streaming}
                placeholder="Appointment, payment, expense yoki klinika bo‘yicha so‘rang…"
                className="block max-h-40 min-h-11 w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="AI Copilot xabari"
              />
              <div className="flex items-center justify-between gap-3 px-2 pb-1">
                <span className="text-[10px] text-slate-400">Enter — yuborish · Shift + Enter — yangi qator</span>
                {streaming ? (
                  <button type="button" onClick={stop} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700 active:scale-95" aria-label="Javobni to‘xtatish"><Square size={13} fill="currentColor" /></button>
                ) : (
                  <button type="button" onClick={() => void send()} disabled={!input.trim()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-700 text-white transition hover:bg-cyan-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400" aria-label="Xabar yuborish"><ArrowUp size={17} strokeWidth={2.4} /></button>
                )}
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">AI xato qilishi mumkin. Moliyaviy va klinik ma’lumotlarni tasdiqlang.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Welcome({ onSuggestion, compact }: { onSuggestion: (value: string) => void; compact: boolean }) {
  return (
    <div className="my-auto py-10 sm:py-16">
      <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_15px_35px_-18px_rgba(15,23,42,.8)]"><Bot size={23} /></div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Ichki AI assistant</p>
      <h2 className={`${compact ? "text-2xl" : "text-3xl sm:text-4xl"} max-w-xl text-balance font-semibold leading-tight tracking-[-0.035em] text-slate-950`}>Klinika ishlarini bir suhbatda boshqaring.</h2>
      <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-slate-500">Qabul, bemor to‘lovlari, qarzdorlik, xarajatlar va tasdiqlangan qo‘llanma bo‘yicha savol bering.</p>
      <div className={`mt-8 grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onSuggestion(suggestion)} className="group rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-medium leading-5 text-slate-600 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-slate-950 hover:shadow-[0_12px_30px_-22px_rgba(8,145,178,.7)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600">
            {suggestion} <ArrowUp size={13} className="ml-1 inline rotate-45 text-slate-300 transition group-hover:text-cyan-600" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="animate-pulse space-y-8 py-6" aria-label="Chat yuklanmoqda">
      <div className="ml-auto h-14 w-3/5 rounded-2xl bg-slate-200" />
      <div className="flex gap-4"><div className="h-9 w-9 rounded-xl bg-slate-200" /><div className="flex-1 space-y-3 pt-1"><div className="h-3 w-full rounded bg-slate-200" /><div className="h-3 w-5/6 rounded bg-slate-200" /><div className="h-3 w-2/3 rounded bg-slate-200" /></div></div>
    </div>
  );
}

function formatSessionDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}
