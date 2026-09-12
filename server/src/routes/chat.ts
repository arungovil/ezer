import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.js";
import { isLlmConfigured } from "../config/env.js";
import { readUserId } from "../middleware/read-user-id.js";
import { listChatForTabUrl, processChat, removeChatMessage } from "../services/chat-service.js";
import type { ApiErrorBody } from "../types/api.js";
import {
  type ChatListResponseBody,
  type ChatResponseBody,
  parseChatRequest,
  parseChatTabUrlQuery,
} from "../types/chat.js";

export function handleListChat(
  req: Request,
  res: Response<ChatListResponseBody | ApiErrorBody>,
): void {
  const tabUrl = parseChatTabUrlQuery(req.query.tabUrl);

  if (!tabUrl) {
    res.status(400).json({ error: errorMessages.tabUrlRequired });
    return;
  }

  try {
    const result = listChatForTabUrl(readUserId(res), tabUrl);
    res.json(result);
  } catch {
    res.status(400).json({ error: errorMessages.invalidTabUrl });
  }
}

export async function handlePostChat(
  req: Request,
  res: Response<ChatResponseBody | ApiErrorBody>,
): Promise<void> {
  const input = parseChatRequest(req.body);

  if (!input) {
    res.status(400).json({ error: errorMessages.chatRequired });
    return;
  }

  if (!isLlmConfigured()) {
    res.status(503).json({ error: errorMessages.llmNotConfigured });
    return;
  }

  try {
    const result = await processChat(readUserId(res), input);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid tab URL") {
      res.status(400).json({ error: errorMessages.invalidTabUrl });
      return;
    }

    res.status(502).json({ error: errorMessages.llmFailed });
  }
}

export function handleDeleteChat(req: Request, res: Response<ApiErrorBody | undefined>): void {
  const chatId = typeof req.params.id === "string" ? req.params.id.trim() : "";

  if (!chatId) {
    res.status(400).json({ error: errorMessages.chatIdRequired });
    return;
  }

  try {
    const deleted = removeChatMessage(readUserId(res), chatId);

    if (!deleted) {
      res.status(404).json({ error: errorMessages.chatNotFound });
      return;
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "Chat message has a linked task") {
      res.status(409).json({ error: errorMessages.chatHasLinkedTask });
      return;
    }

    res.status(500).json({ error: errorMessages.requestFailed });
  }
}
