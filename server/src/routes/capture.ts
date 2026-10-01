import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.ts";
import { isLlmConfigured } from "../config/env.ts";
import { readUserId } from "../middleware/read-user-id.ts";
import { parseCaptureRequest } from "../parsers.ts";
import { processCapture } from "../services/capture-service.ts";
import type { ApiErrorBody, CaptureResponseBody } from "../types.ts";

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
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid tab URL") {
      res.status(400).json({ error: errorMessages.invalidTabUrl });
      return;
    }

    res.status(500).json({ error: errorMessages.capturePersistFailed });
  }
}
