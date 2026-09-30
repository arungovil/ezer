import { parseTabUrlQuery } from "./capture.ts";

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

export const chatIntents = ["specific", "summary", "out_of_scope"] as const;

export type ChatIntent = (typeof chatIntents)[number];

export interface Classification {
  intent: ChatIntent;
  standaloneQuery: string;
  topic: string;
  keywords: string[];
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

  return { message, tabUrl };
}

export function parseChatTabUrlQuery(value: unknown): string | null {
  return parseTabUrlQuery(value);
}

function isChatIntent(value: unknown): value is ChatIntent {
  return typeof value === "string" && (chatIntents as readonly string[]).includes(value);
}

// Accepts both camelCase and snake_case for the query field, since models are inconsistent.
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
