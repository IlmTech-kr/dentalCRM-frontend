import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { tenantFetch, tenantHttp } from "@/src/lib/api/http";
import type {
  AiChatMessage,
  AiChatReply,
  AiChatSession,
  AiPendingAction,
  AiStreamCallbacks,
  AiStreamError,
} from "@/src/types/ai.types";

export async function listAiSessions(): Promise<AiChatSession[]> {
  const { data } = await tenantHttp().get<AiChatSession[]>(ENDPOINTS.ai.sessions);
  return data;
}

export async function createAiSession(title?: string): Promise<AiChatSession> {
  const { data } = await tenantHttp().post<AiChatSession>(ENDPOINTS.ai.sessions, {
    title: title?.trim() || null,
  });
  return data;
}

export async function getAiHistory(sessionId: string): Promise<AiChatMessage[]> {
  const { data } = await tenantHttp().get<AiChatMessage[]>(
    ENDPOINTS.ai.history(sessionId)
  );
  return data;
}

export async function confirmAiAction(
  actionId: string,
  voidReason?: string
): Promise<AiPendingAction> {
  const { data } = await tenantHttp().post<AiPendingAction>(
    ENDPOINTS.ai.confirmAction(actionId),
    { voidReason: voidReason?.trim() || null }
  );
  return data;
}

export async function cancelAiAction(actionId: string): Promise<AiPendingAction> {
  const { data } = await tenantHttp().post<AiPendingAction>(
    ENDPOINTS.ai.cancelAction(actionId),
    {}
  );
  return data;
}

export async function streamAiMessage(
  sessionId: string,
  content: string,
  language: string,
  callbacks: AiStreamCallbacks,
  signal: AbortSignal
): Promise<void> {
  const response = await tenantFetch(ENDPOINTS.ai.stream(sessionId), {
    method: "POST",
    headers: { Accept: "text/event-stream" },
    body: JSON.stringify({ content, language }),
    signal,
  });

  if (!response.ok) {
    const error = await readHttpError(response);
    callbacks.onError(error);
    return;
  }
  if (!response.body) {
    callbacks.onError({
      code: "STREAM_UNAVAILABLE",
      message: "Realtime javob oqimini ochib bo‘lmadi.",
      retryable: true,
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";
    for (const block of blocks) dispatchEventBlock(block, callbacks);
    if (done) break;
  }
  if (buffer.trim()) dispatchEventBlock(buffer, callbacks);
}

function dispatchEventBlock(block: string, callbacks: AiStreamCallbacks): void {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return;

  try {
    const payload = JSON.parse(dataLines.join("\n")) as unknown;
    if (eventName === "token") {
      callbacks.onToken((payload as { content?: string }).content || "");
    } else if (eventName === "done") {
      callbacks.onDone(payload as AiChatReply);
    } else if (eventName === "error") {
      callbacks.onError(payload as AiStreamError);
    }
  } catch {
    callbacks.onError({
      code: "STREAM_PARSE_FAILED",
      message: "AI javobini o‘qishda xatolik yuz berdi.",
      retryable: true,
    });
  }
}

async function readHttpError(response: Response): Promise<AiStreamError> {
  try {
    const body = (await response.json()) as { code?: string; message?: string };
    return {
      code: body.code || `HTTP_${response.status}`,
      message: body.message || "AI so‘rovi bajarilmadi.",
      retryable: response.status >= 500,
    };
  } catch {
    return {
      code: `HTTP_${response.status}`,
      message: "AI so‘rovi bajarilmadi.",
      retryable: response.status >= 500,
    };
  }
}
