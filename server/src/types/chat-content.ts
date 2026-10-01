import type { TaskKind } from "./capture.ts";

export interface ChatTaskListItem {
  id: string;
  title: string;
  summary: string | null;
  dueAt: string | null;
}

export interface ChatTaskListContent {
  format: "taskList";
  kind: TaskKind;
  intro: string;
  items: ChatTaskListItem[];
}

export interface ChatMarkdownContent {
  format: "markdown";
  text: string;
}

export type ChatContent = ChatMarkdownContent | ChatTaskListContent;

function isTaskListItem(value: unknown): value is ChatTaskListItem {
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
    record.items.every(isTaskListItem)
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
