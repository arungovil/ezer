import { randomUUID } from "node:crypto";
import {
  getChatById,
  insertChat,
  listChatsByOriginId,
  listRecentChatsByOriginId,
  softDeleteChatById,
} from "../db/chat.ts";
import { getOrCreateOrigin, getOriginByIdForUser, getOriginByUserAndOrigin } from "../db/origin.ts";
import { taskExistsForChatId } from "../db/task.ts";
import { parsePageOrigin } from "../lib/parse-origin.ts";
import { serializeChatContent, toChatMessageBody } from "../parsers.ts";
import type { ChatListResponseBody, ChatRequestBody, ChatResponseBody } from "../types.ts";
import { handleAssistantMessage } from "./assistant-service.ts";
import { buildQuickActionReply, quickActionReplyText } from "./quick-action-service.ts";

const chatHistoryLimit = 6;

export function listChatForTabUrl(userId: string, tabUrl: string): ChatListResponseBody {
  const pageOrigin = parsePageOrigin(tabUrl);
  if (!pageOrigin) {
    throw new Error("Invalid tab URL");
  }

  const origin = getOriginByUserAndOrigin(userId, pageOrigin);
  const messages = origin ? listChatsByOriginId(origin.id) : [];

  return {
    originId: origin?.id ?? null,
    origin: origin?.origin ?? null,
    tabUrl,
    messages: messages.map(toChatMessageBody),
  };
}

export async function processChat(
  userId: string,
  input: ChatRequestBody,
): Promise<ChatResponseBody> {
  const pageOrigin = parsePageOrigin(input.tabUrl);
  if (!pageOrigin) {
    throw new Error("Invalid tab URL");
  }

  const origin = getOrCreateOrigin(userId, pageOrigin);
  const userMessageId = randomUUID();
  const ezerMessageId = randomUUID();

  if (input.action) {
    const content = buildQuickActionReply(userId, input.tabUrl, input.action);
    const reply = quickActionReplyText(content);
    const messageType = "QUICK_ACTION";

    insertChat({
      id: userMessageId,
      originId: origin.id,
      role: "user",
      messageType,
      content: input.message,
    });

    insertChat({
      id: ezerMessageId,
      originId: origin.id,
      role: "ezer",
      messageType,
      content: serializeChatContent(content),
      agentState: null,
    });

    return {
      originId: origin.id,
      origin: origin.origin,
      reply,
      rejected: false,
      userMessageId,
      ezerMessageId,
      content,
    };
  }

  const history = listRecentChatsByOriginId(origin.id, chatHistoryLimit);
  const assistant = await handleAssistantMessage(origin.id, userId, input.message, history);

  insertChat({
    id: userMessageId,
    originId: origin.id,
    role: "user",
    messageType: "TEXT",
    content: input.message,
  });

  insertChat({
    id: ezerMessageId,
    originId: origin.id,
    role: "ezer",
    messageType: "TEXT",
    content: assistant.reply,
    agentState: assistant.state ? JSON.stringify(assistant.state) : null,
  });

  return {
    originId: origin.id,
    origin: origin.origin,
    reply: assistant.reply,
    rejected: assistant.rejected,
    userMessageId,
    ezerMessageId,
  };
}

export function removeChatMessage(userId: string, chatId: string): boolean {
  const chat = getChatById(chatId);
  if (!chat) {
    return false;
  }

  const origin = getOriginByIdForUser(chat.originId, userId);
  if (!origin) {
    return false;
  }

  if (taskExistsForChatId(chatId)) {
    throw new Error("Chat message has a linked task");
  }

  return softDeleteChatById(chatId);
}
