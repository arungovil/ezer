import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.js";
import type { ApiErrorBody } from "../types/api.js";
import { type CompileResponseBody, parseRawEvents } from "../types/compile.js";

// TODO: LLM compile + AST validation w/ repair-retry
export function handleCompile(
  req: Request,
  res: Response<CompileResponseBody | ApiErrorBody>,
): void {
  const rawEvents = parseRawEvents(req.body);

  if (!rawEvents) {
    res.status(400).json({ error: errorMessages.rawEventsRequired });
    return;
  }

  res.json({ workflowName: "untitled", description: "stub AST", steps: [] });
}
