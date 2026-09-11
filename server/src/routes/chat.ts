import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.js";
import { isLlmConfigured } from "../config/env.js";
import { chatWithLlm } from "../services/chat-service.js";
import type { ApiErrorBody } from "../types/api.js";
import { type ChatResponseBody, parseChatMessage } from "../types/chat.js";

export async function handleChat(
  req: Request,
  res: Response<ChatResponseBody | ApiErrorBody>,
): Promise<void> {
  const message = parseChatMessage(req.body);

  if (!message) {
    res.status(400).json({ error: errorMessages.messageRequired });
    return;
  }

  if (!isLlmConfigured()) {
    res.status(503).json({ error: errorMessages.llmNotConfigured });
    return;
  }

  try {
    const result = await chatWithLlm(message);
    res.json({ reply: result.message, rejected: !result.onTopic });
  } catch {
    res.status(502).json({ error: errorMessages.llmFailed });
  }
}
