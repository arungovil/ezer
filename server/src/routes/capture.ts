import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.js";
import { isLlmConfigured } from "../config/env.js";
import { listChatsByOriginId } from "../db/chat.js";
import { getOriginByUserAndOrigin } from "../db/origin.js";
import { parsePageOrigin } from "../lib/parse-origin.js";
import { readUserId } from "../middleware/read-user-id.js";
import { processCapture } from "../services/capture-service.js";
import type { ApiErrorBody } from "../types/api.js";
import {
  type CaptureResponseBody,
  type ConversationMessagesResponseBody,
  parseCaptureRequest,
  parseTabUrlQuery,
  toStoredMessageBody,
} from "../types/capture.js";

export async function handleCapture(
  req: Request,
  res: Response<CaptureResponseBody | ApiErrorBody>,
): Promise<void> {
  const input = parseCaptureRequest(req.body);

  if (!input) {
    res.status(400).json({ error: errorMessages.captureRequired });
    return;
  }

  if (!isLlmConfigured()) {
    res.status(503).json({ error: errorMessages.llmNotConfigured });
    return;
  }

  try {
    const result = await processCapture(readUserId(res), input);
    res.json(result);
  } catch {
    res.status(502).json({ error: errorMessages.llmFailed });
  }
}

export function handleConversationMessages(
  req: Request,
  res: Response<ConversationMessagesResponseBody | ApiErrorBody>,
): void {
  const tabUrl = parseTabUrlQuery(req.query.tabUrl);

  if (!tabUrl) {
    res.status(400).json({ error: errorMessages.tabUrlRequired });
    return;
  }

  const pageOrigin = parsePageOrigin(tabUrl);
  if (!pageOrigin) {
    res.status(400).json({ error: errorMessages.invalidTabUrl });
    return;
  }

  const userId = readUserId(res);
  const origin = getOriginByUserAndOrigin(userId, pageOrigin);
  const messages = origin ? listChatsByOriginId(origin.id) : [];

  res.json({
    originId: origin?.id ?? null,
    origin: origin?.origin ?? null,
    tabUrl,
    messages: messages.map(toStoredMessageBody),
  });
}
