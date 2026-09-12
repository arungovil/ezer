export interface ApiErrorBody {
  error: string;
}

export interface ChatRequestBody {
  message: string;
  tabUrl: string;
}

export interface ChatMessageBody {
  id: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
  createdAt: string;
}

export interface ChatListResponseBody {
  originId: string | null;
  origin: string | null;
  tabUrl: string;
  messages: ChatMessageBody[];
}

export interface ChatResponseBody {
  originId: string;
  origin: string;
  reply: string;
  rejected: boolean;
  userMessageId: string;
  ezerMessageId: string;
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
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as ChatResponseBody;
  return (
    typeof body.originId === "string" &&
    typeof body.origin === "string" &&
    typeof body.reply === "string" &&
    typeof body.rejected === "boolean" &&
    typeof body.userMessageId === "string" &&
    typeof body.ezerMessageId === "string"
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

function isChatMessageBody(value: unknown): value is ChatMessageBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as ChatMessageBody;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "ezer") &&
    typeof message.messageType === "string" &&
    typeof message.content === "string" &&
    typeof message.createdAt === "string"
  );
}

export function isChatListResponseBody(value: unknown): value is ChatListResponseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as ChatListResponseBody;
  return (
    (body.originId === null || typeof body.originId === "string") &&
    (body.origin === null || typeof body.origin === "string") &&
    typeof body.tabUrl === "string" &&
    Array.isArray(body.messages) &&
    body.messages.every(isChatMessageBody)
  );
}

export type WorkflowActionType = "CLICK" | "INPUT" | "SUBMIT";

export interface RecordedActionBody {
  type: WorkflowActionType;
  selectors: string[];
  value?: string;
  checked?: boolean;
  innerText?: string;
  tagName: string;
}

export interface CreateWorkflowRequestBody {
  name: string;
  tabUrl: string;
  actions: RecordedActionBody[];
}

export interface WorkflowResponseBody {
  id: string;
  originId: string;
  origin: string;
  name: string;
  actions: RecordedActionBody[];
  createdAt: string;
}

export interface WorkflowListResponseBody {
  originId: string | null;
  origin: string | null;
  tabUrl: string;
  workflows: WorkflowResponseBody[];
}

const workflowActionTypes = ["CLICK", "INPUT", "SUBMIT"] as const;

function isWorkflowActionType(value: unknown): value is WorkflowActionType {
  return typeof value === "string" && (workflowActionTypes as readonly string[]).includes(value);
}

function isRecordedActionBody(value: unknown): value is RecordedActionBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const action = value as RecordedActionBody;
  return (
    isWorkflowActionType(action.type) &&
    Array.isArray(action.selectors) &&
    action.selectors.every((selector) => typeof selector === "string") &&
    typeof action.tagName === "string" &&
    (action.value === undefined || typeof action.value === "string") &&
    (action.checked === undefined || typeof action.checked === "boolean") &&
    (action.innerText === undefined || typeof action.innerText === "string")
  );
}

export function isWorkflowResponseBody(value: unknown): value is WorkflowResponseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as WorkflowResponseBody;
  return (
    typeof body.id === "string" &&
    typeof body.originId === "string" &&
    typeof body.origin === "string" &&
    typeof body.name === "string" &&
    Array.isArray(body.actions) &&
    body.actions.every(isRecordedActionBody) &&
    typeof body.createdAt === "string"
  );
}

export function isWorkflowListResponseBody(value: unknown): value is WorkflowListResponseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as WorkflowListResponseBody;
  return (
    (body.originId === null || typeof body.originId === "string") &&
    (body.origin === null || typeof body.origin === "string") &&
    typeof body.tabUrl === "string" &&
    Array.isArray(body.workflows) &&
    body.workflows.every(isWorkflowResponseBody)
  );
}
