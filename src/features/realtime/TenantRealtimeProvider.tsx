"use client";

import { useEffect, useRef, useState } from "react";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { tenantFetch } from "@/src/lib/api/http";
import { queryClient } from "@/src/lib/react-query/client";
import { useAuthStore } from "@/src/store/auth.store";

interface DomainEvent {
  id: string;
  source: "AI_CONFIRMED" | "DIRECT_UI";
  aggregateType: string;
  aggregateId: string;
  operation: string;
  relatedIds: string[];
  occurredAt: string;
  ownAction: boolean;
}

const QUERY_ROOTS: Record<string, string[]> = {
  PATIENT: ["patients", "patient", "patients-count"],
  APPOINTMENT: [
    "appointments",
    "appointments-by-range",
    "appointments-today",
    "treatment-today-in-progress-appointments",
  ],
  TREATMENT_COURSE: [
    "treatment-courses",
    "dental-chart",
    "dental-charts",
    "statistics",
    "treatment-payments",
  ],
  TREATMENT_PAYMENT: [
    "treatment-payments",
    "treatment-courses",
    "statistics",
  ],
  EXPENSE: ["expenses", "statistics"],
  RECURRING_EXPENSE: ["recurring-expenses", "expenses", "statistics"],
  EXPENSE_CATEGORY: ["expense-categories", "expenses"],
  PROCEDURE: ["dental-procedures", "treatment-courses"],
  DENTAL_CHART: ["dental-chart", "dental-charts", "treatment-courses"],
};

export default function TenantRealtimeProvider() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const [lastEvent, setLastEvent] = useState<DomainEvent | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!authenticated || !userId) return;
    const controller = new AbortController();
    const delivered = new Set<string>();
    let reconnectTimer: number | null = null;
    let active = true;
    const eventStorageKey = `dental:last-domain-event-id:${userId}`;

    async function connect() {
      if (!active) return;
      const lastEventId = sessionStorage.getItem(eventStorageKey);
      try {
        const response = await tenantFetch(ENDPOINTS.realtime.stream, {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
          },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          if (
            response.headers.get("X-Dental-Realtime-Enabled") === "false"
          ) {
            return;
          }
          scheduleReconnect();
          return;
        }
        retryRef.current = 0;
        await consumeStream(response.body, (name, id, payload) => {
          if (name !== "domain_event") return;
          const event = payload as DomainEvent;
          const eventId = id || event.id;
          if (!eventId || delivered.has(eventId)) return;
          delivered.add(eventId);
          if (delivered.size > 1_000) {
            const oldest = delivered.values().next().value as string | undefined;
            if (oldest) delivered.delete(oldest);
          }
          sessionStorage.setItem(eventStorageKey, eventId);
          void invalidateDomainQueries(event);
          highlightDomainEntity(event);
          setLastEvent(event);
          window.setTimeout(() => {
            setLastEvent((current) => current?.id === event.id ? null : current);
          }, 3_000);
        });
        scheduleReconnect();
      } catch (cause) {
        if ((cause as { name?: string })?.name !== "AbortError") {
          scheduleReconnect();
        }
      }
    }

    function scheduleReconnect() {
      if (!active || controller.signal.aborted) return;
      const attempt = Math.min(retryRef.current++, 5);
      const delay = Math.min(1_000 * 2 ** attempt, 30_000);
      reconnectTimer = window.setTimeout(() => void connect(), delay);
    }

    void connect();
    return () => {
      active = false;
      controller.abort();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    };
  }, [authenticated, userId]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-none fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 transition duration-200 motion-reduce:transition-none ${
        lastEvent ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="rounded-full border border-emerald-200 bg-white/95 px-3.5 py-2 text-[11px] font-semibold text-emerald-800 shadow-lg backdrop-blur">
        {lastEvent ? realtimeLabel(lastEvent) : ""}
      </div>
    </div>
  );
}

async function consumeStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (name: string, id: string, payload: unknown) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";
    for (const block of blocks) dispatchSseBlock(block, onEvent);
    if (done) break;
  }
  if (buffer.trim()) dispatchSseBlock(buffer, onEvent);
}

function dispatchSseBlock(
  block: string,
  onEvent: (name: string, id: string, payload: unknown) => void
) {
  let name = "message";
  let id = "";
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    if (line.startsWith("id:")) id = line.slice(3).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (data.length === 0) return;
  try {
    onEvent(name, id, JSON.parse(data.join("\n")) as unknown);
  } catch {
    return;
  }
}

async function invalidateDomainQueries(event: DomainEvent): Promise<void> {
  const roots = QUERY_ROOTS[event.aggregateType] || [];
  await Promise.all(
    roots.map((root) => queryClient.invalidateQueries({ queryKey: [root] }))
  );
  window.setTimeout(() => highlightDomainEntity(event), 120);
  window.setTimeout(() => highlightDomainEntity(event), 650);
}

function highlightDomainEntity(event: DomainEvent) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ids = [event.aggregateId, ...event.relatedIds].filter(Boolean);
  for (const id of ids) {
    const escaped = CSS.escape(id);
    document.querySelectorAll<HTMLElement>(
      `[data-entity-id="${escaped}"]`
    ).forEach((element) => {
      element.animate(
        [
          { backgroundColor: "rgba(16, 185, 129, 0.22)" },
          { backgroundColor: "rgba(16, 185, 129, 0)" },
        ],
        { duration: 3_000, easing: "cubic-bezier(.22,1,.36,1)" }
      );
    });
  }
}

function realtimeLabel(event: DomainEvent): string {
  const source = event.source === "AI_CONFIRMED" ? "AI amal" : "Klinika yozuvi";
  return `${source}: ${event.aggregateType.replaceAll("_", " ").toLowerCase()} yangilandi`;
}
