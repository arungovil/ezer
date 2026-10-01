import type {
  CaptureLlmResult,
  CaptureRequestBody,
  ChatContent,
  ChatIntent,
  ChatMarkdownContent,
  ChatMessageBody,
  ChatRequestBody,
  ChatTaskListContent,
  ChatTaskListItem,
  Classification,
  CreateTaskRequestBody,
  QuickActionId,
  TaskKind,
  TaskResponseBody,
  TaskStatus,
  UpdateTaskRequestBody,
  UserResponseBody,
} from "./types.ts";
import { chatIntents, quickActionIds, taskKinds } from "./types.ts";

const taskStatuses = ["active", "done", "dismissed"] as const;

function isTaskKind(value: unknown): value is TaskKind {
  return typeof value === "string" && (taskKinds as readonly string[]).includes(value);
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (taskStatuses as readonly string[]).includes(value);
}

function isChatListItem(value: unknown): value is ChatTaskListItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as ChatTaskListItem;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    (item.summary === null || typeof item.summary === "string") &&
    (item.dueAt === null || typeof item.dueAt === "string")
  );
}

function isChatIntent(value: unknown): value is ChatIntent {
  return typeof value === "string" && (chatIntents as readonly string[]).includes(value);
}

export function toUserResponseBody(user: { id: string; createdAt: string }): UserResponseBody {
  return {
    id: user.id,
    createdAt: user.createdAt,
  };
}

export function isQuickActionId(value: unknown): value is QuickActionId {
  return typeof value === "string" && (quickActionIds as readonly string[]).includes(value);
}

export function parseCaptureRequest(body: unknown): CaptureRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as CaptureRequestBody;
  if (typeof record.text !== "string" || typeof record.tabUrl !== "string") {
    return null;
  }

  const text = record.text.trim();
  const tabUrl = record.tabUrl.trim();
  if (!text || !tabUrl) {
    return null;
  }

  return {
    text,
    tabUrl,
    ...(typeof record.url === "string" && record.url.trim() ? { url: record.url.trim() } : {}),
    ...(typeof record.title === "string" && record.title.trim()
      ? { title: record.title.trim() }
      : {}),
    ...(typeof record.timezone === "string" && record.timezone.trim()
      ? { timezone: record.timezone.trim() }
      : {}),
  };
}

export function parseTabUrlQuery(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const tabUrl = value.trim();
  return tabUrl.length > 0 ? tabUrl : null;
}

export function isCaptureLlmResult(value: unknown): value is CaptureLlmResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const result = value as CaptureLlmResult;
  const dueAt = result.dueAt;

  return (
    isTaskKind(result.kind) &&
    typeof result.title === "string" &&
    result.title.trim().length > 0 &&
    (dueAt === null || typeof dueAt === "string") &&
    typeof result.summary === "string" &&
    typeof result.reply === "string" &&
    result.reply.trim().length > 0
  );
}

export function parseCreateTaskRequest(body: unknown): CreateTaskRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as CreateTaskRequestBody;
  if (
    typeof record.title !== "string" ||
    typeof record.tabUrl !== "string" ||
    !isTaskKind(record.kind)
  ) {
    return null;
  }

  const title = record.title.trim();
  const tabUrl = record.tabUrl.trim();
  if (!title || !tabUrl) {
    return null;
  }

  return {
    kind: record.kind,
    title,
    tabUrl,
    ...(typeof record.summary === "string" ? { summary: record.summary.trim() } : {}),
    ...(record.dueAt === null || typeof record.dueAt === "string" ? { dueAt: record.dueAt } : {}),
    ...(typeof record.sourceUrl === "string" && record.sourceUrl.trim()
      ? { sourceUrl: record.sourceUrl.trim() }
      : {}),
    ...(typeof record.sourceTitle === "string" && record.sourceTitle.trim()
      ? { sourceTitle: record.sourceTitle.trim() }
      : {}),
  };
}

export function parseUpdateTaskRequest(body: unknown): UpdateTaskRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as UpdateTaskRequestBody;
  const update: UpdateTaskRequestBody = {};

  if (record.status !== undefined) {
    if (!isTaskStatus(record.status)) {
      return null;
    }
    update.status = record.status;
  }

  if (record.kind !== undefined) {
    if (!isTaskKind(record.kind)) {
      return null;
    }
    update.kind = record.kind;
  }

  if (record.title !== undefined) {
    if (typeof record.title !== "string") {
      return null;
    }
    const title = record.title.trim();
    if (!title) {
      return null;
    }
    update.title = title;
  }

  if (record.summary !== undefined) {
    if (record.summary !== null && typeof record.summary !== "string") {
      return null;
    }
    update.summary = record.summary === null ? null : record.summary.trim();
  }

  if (record.dueAt !== undefined) {
    if (record.dueAt !== null && typeof record.dueAt !== "string") {
      return null;
    }
    update.dueAt = record.dueAt;
  }

  return Object.keys(update).length > 0 ? update : null;
}

export function parseTaskTabUrlQuery(value: unknown): string | null {
  return parseTabUrlQuery(value);
}

export function parseTaskStatusQuery(value: unknown): TaskStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const status = value.trim();
  return isTaskStatus(status) ? status : null;
}

export function toTaskResponseBody(task: {
  id: string;
  originId: string;
  origin: string;
  chatId: string | null;
  kind: TaskKind;
  title: string;
  summary: string | null;
  dueAt: string | null;
  status: TaskStatus;
  sourceUrl: string | null;
  sourceTitle: string | null;
  createdAt: string;
}): TaskResponseBody {
  return {
    id: task.id,
    originId: task.originId,
    origin: task.origin,
    chatId: task.chatId,
    kind: task.kind,
    title: task.title,
    summary: task.summary,
    dueAt: task.dueAt,
    status: task.status,
    sourceUrl: task.sourceUrl,
    sourceTitle: task.sourceTitle,
    createdAt: task.createdAt,
  };
}

export function isChatMarkdownContent(value: unknown): value is ChatMarkdownContent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as ChatMarkdownContent;
  return record.format === "markdown" && typeof record.text === "string";
}

export function isChatTaskListContent(value: unknown): value is ChatTaskListContent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as ChatTaskListContent;
  return (
    record.format === "taskList" &&
    (record.kind === "note" || record.kind === "reminder") &&
    typeof record.intro === "string" &&
    Array.isArray(record.items) &&
    record.items.every(isChatListItem)
  );
}

export function isChatContent(value: unknown): value is ChatContent {
  return isChatMarkdownContent(value) || isChatTaskListContent(value);
}

export function serializeChatContent(content: ChatContent): string {
  return JSON.stringify(content);
}

export function parseStoredChatContent(raw: string): ChatContent {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isChatContent(parsed)) {
      return parsed;
    }
  } catch {
    // Legacy rows stored plain markdown before structured content.
  }

  return { format: "markdown", text: raw };
}

export function parseChatRequest(body: unknown): ChatRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as ChatRequestBody;
  if (typeof record.message !== "string" || typeof record.tabUrl !== "string") {
    return null;
  }

  const message = record.message.trim();
  const tabUrl = record.tabUrl.trim();
  if (!message || !tabUrl) {
    return null;
  }

  if (record.action !== undefined && !isQuickActionId(record.action)) {
    return null;
  }

  return {
    message,
    tabUrl,
    ...(record.action ? { action: record.action } : {}),
  };
}

export function parseChatTabUrlQuery(value: unknown): string | null {
  return parseTabUrlQuery(value);
}

export function parseClassification(value: unknown): Classification | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const standaloneQuery = record.standaloneQuery ?? record.standalone_query;

  if (
    !isChatIntent(record.intent) ||
    typeof standaloneQuery !== "string" ||
    typeof record.topic !== "string" ||
    !Array.isArray(record.keywords) ||
    !record.keywords.every((keyword) => typeof keyword === "string")
  ) {
    return null;
  }

  return {
    intent: record.intent,
    standaloneQuery,
    topic: record.topic,
    keywords: record.keywords,
  };
}

export function toChatMessageBody(message: {
  id: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
  createdAt: string;
}): ChatMessageBody {
  return {
    id: message.id,
    role: message.role,
    messageType: message.messageType,
    content: message.content,
    createdAt: message.createdAt,
  };
}
