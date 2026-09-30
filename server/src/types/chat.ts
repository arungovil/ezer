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

export interface ChatLlmResult {
  onTopic: boolean;
  message: string;
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

export function isChatLlmResult(value: unknown): value is ChatLlmResult {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChatLlmResult).onTopic === "boolean" &&
    typeof (value as ChatLlmResult).message === "string"
  );
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
