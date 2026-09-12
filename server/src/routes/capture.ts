import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.js";
import { isLlmConfigured } from "../config/env.js";
import { readUserId } from "../middleware/read-user-id.js";
import { processCapture } from "../services/capture-service.js";
import type { ApiErrorBody } from "../types/api.js";
import { type CaptureResponseBody, parseCaptureRequest } from "../types/capture.js";

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
