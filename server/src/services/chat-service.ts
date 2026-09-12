import { randomUUID } from "node:crypto";
import { getEnv } from "../config/env.js";
import { deleteChatById, getChatById, insertChat, listChatsByOriginId } from "../db/chat.js";
import { getOrCreateOrigin, getOriginByIdForUser, getOriginByUserAndOrigin } from "../db/origin.js";
import { taskExistsForChatId } from "../db/task.js";
import { parsePageOrigin } from "../lib/parse-origin.js";
import { chatSystemPrompt } from "../prompts/chat.js";
import {
  type ChatListResponseBody,
  type ChatLlmResult,
  type ChatRequestBody,
  type ChatResponseBody,
  isChatLlmResult,
  toChatMessageBody,
} from "../types/chat.js";
import { getLlmClient } from "./llm-client.js";

function parseChatLlmResult(raw: string): ChatLlmResult {
  const parsed: unknown = JSON.parse(raw);

  if (!isChatLlmResult(parsed)) {
    throw new Error("Invalid LLM response shape");
  }

  return parsed;
}

export async function chatWithLlm(userMessage: string): Promise<ChatLlmResult> {
  const { llmModel } = getEnv();
  const completion = await getLlmClient().chat.completions.create({
    model: llmModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: chatSystemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty LLM response");
  }

  return parseChatLlmResult(content);
}

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

  insertChat({
    id: userMessageId,
    originId: origin.id,
    role: "user",
    messageType: "TEXT",
    content: input.message,
  });

  const llmResult = await chatWithLlm(input.message);

  insertChat({
    id: ezerMessageId,
    originId: origin.id,
    role: "ezer",
    messageType: "TEXT",
    content: llmResult.message.trim(),
  });

  return {
    originId: origin.id,
    origin: origin.origin,
    reply: llmResult.message.trim(),
    rejected: !llmResult.onTopic,
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

  return deleteChatById(chatId);
}
