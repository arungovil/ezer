export interface ApiErrorBody {
  error: string;
}

export interface ChatRequestBody {
  message: string;
}

export interface ChatResponseBody {
  reply: string;
  rejected: boolean;
}

export type ItemKind = "task" | "reminder" | "note";

export interface CaptureRequestBody {
  text: string;
  tabUrl: string;
  url?: string;
  title?: string;
  timezone?: string;
}

export interface CaptureItemBody {
  id: string;
  kind: ItemKind;
  title: string;
  dueAt: string | null;
  summary: string | null;
}

export interface CaptureResponseBody {
  taskId: string;
  originId: string;
  origin: string;
  item: CaptureItemBody;
  reply: string;
  userMessageId: string;
  ezerMessageId: string;
}

export interface StoredMessageBody {
  id: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
  createdAt: string;
}

export interface ConversationMessagesResponseBody {
  originId: string | null;
  origin: string | null;
  tabUrl: string;
  messages: StoredMessageBody[];
}

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  message: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" && value !== null && typeof (value as ApiErrorBody).error === "string"
  );
}

export function isChatResponseBody(value: unknown): value is ChatResponseBody {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChatResponseBody).reply === "string" &&
    typeof (value as ChatResponseBody).rejected === "boolean"
  );
}

const itemKinds = ["task", "reminder", "note"] as const;

function isItemKind(value: unknown): value is ItemKind {
  return typeof value === "string" && (itemKinds as readonly string[]).includes(value);
}

function isCaptureItemBody(value: unknown): value is CaptureItemBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as CaptureItemBody;
  return (
    typeof item.id === "string" &&
    isItemKind(item.kind) &&
    typeof item.title === "string" &&
    (item.dueAt === null || typeof item.dueAt === "string") &&
    (item.summary === null || typeof item.summary === "string")
  );
}

export function isCaptureResponseBody(value: unknown): value is CaptureResponseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as CaptureResponseBody;
  return (
    typeof body.taskId === "string" &&
    typeof body.originId === "string" &&
    typeof body.origin === "string" &&
    isCaptureItemBody(body.item) &&
    typeof body.reply === "string" &&
    typeof body.userMessageId === "string" &&
    typeof body.ezerMessageId === "string"
  );
}

function isStoredMessageBody(value: unknown): value is StoredMessageBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as StoredMessageBody;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "ezer") &&
    typeof message.messageType === "string" &&
    typeof message.content === "string" &&
    typeof message.createdAt === "string"
  );
}

export function isConversationMessagesResponseBody(
  value: unknown,
): value is ConversationMessagesResponseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as ConversationMessagesResponseBody;
  return (
    (body.originId === null || typeof body.originId === "string") &&
    (body.origin === null || typeof body.origin === "string") &&
    typeof body.tabUrl === "string" &&
    Array.isArray(body.messages) &&
    body.messages.every(isStoredMessageBody)
  );
}
