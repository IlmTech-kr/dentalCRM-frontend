export type AiMessageRole = "USER" | "ASSISTANT";

export type AiActionStatus =
  | "PENDING"
  | "CONFIRMING"
  | "CONFIRMED"
  | "CANCELLED"
  | "SUPERSEDED"
  | "EXPIRED"
  | "FAILED";

export interface AiGuideSource {
  sectionId: string;
  title: string;
  version: string;
  language: string;
}

export interface AiPendingAction {
  id: string;
  type: string;
  status: AiActionStatus;
  preview: string;
  expiresAt: string;
  confirmedAt: string | null;
  editablePayload: Record<string, unknown>;
  formKind: AiFormKind;
  targetRoute: string;
  entityVersion: number | null;
  supersededByActionId: string | null;
  result: unknown | null;
}

export type AiFormKind =
  | "PATIENT"
  | "APPOINTMENT"
  | "PAYMENT"
  | "EXPENSE"
  | "RECURRING_EXPENSE"
  | "EXPENSE_CATEGORY"
  | "PROCEDURE"
  | "TREATMENT";

export interface AiUiCommand {
  type: "NAVIGATE_AND_PREFILL";
  actionId: string;
  targetRoute: string;
  formKind: AiFormKind;
}

export interface AiChatMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  sources: AiGuideSource[];
  pendingActions: AiPendingAction[];
  createdAt: string;
  streaming?: boolean;
  failed?: boolean;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface AiUsage {
  month: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  monthlyLimitUsd: number;
  remainingUsd: number;
  warningThresholdReached: boolean;
  limitReached: boolean;
}

export interface AiChatReply {
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
  usage: AiUsage;
}

export interface AiStreamError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface AiStreamCallbacks {
  onToken: (content: string) => void;
  onActionPreview: (action: AiPendingAction) => void;
  onUiCommand: (command: AiUiCommand) => void;
  onDone: (reply: AiChatReply) => void;
  onError: (error: AiStreamError) => void;
}
