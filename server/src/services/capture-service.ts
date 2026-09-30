import { randomUUID } from "node:crypto";
import { getEnv } from "../config/env.ts";
import { insertChat } from "../db/chat.ts";
import { getOrCreateOrigin } from "../db/origin.ts";
import { insertTask } from "../db/task.ts";
import { parsePageOrigin } from "../lib/parse-origin.ts";
import { captureSystemPrompt } from "../prompts/capture.ts";
import {
  type CaptureLlmResult,
  type CaptureRequestBody,
  type CaptureResponseBody,
  isCaptureLlmResult,
} from "../types/capture.ts";
import { getLlmClient } from "./llm-client.ts";

function parseCaptureLlmResult(raw: string): CaptureLlmResult {
  const parsed: unknown = JSON.parse(raw);

  if (!isCaptureLlmResult(parsed)) {
    throw new Error("Invalid LLM response shape");
  }

  return parsed;
}

function buildUserPrompt(input: CaptureRequestBody): string {
  const lines = [`Selected text:\n${input.text}`, `Page URL: ${input.url ?? input.tabUrl}`];

  if (input.title) {
    lines.push(`Page title: ${input.title}`);
  }

  if (input.timezone) {
    lines.push(`User timezone: ${input.timezone}`);
  }

  lines.push(`Captured at: ${new Date().toISOString()}`);
  return lines.join("\n\n");
}

function fallbackCaptureResult(text: string): CaptureLlmResult {
  const title = text.length > 80 ? `${text.slice(0, 77)}...` : text;

  return {
    kind: "note",
    title,
    dueAt: null,
    summary: "Saved your selection as a note.",
    reply: `📌 **Noted.** I saved this as a note:\n\n> ${title}`,
  };
}

async function extractCapture(input: CaptureRequestBody): Promise<CaptureLlmResult> {
  const { llmModel } = getEnv();
  const completion = await getLlmClient().chat.completions.create({
    model: llmModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: captureSystemPrompt },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty LLM response");
  }

  return parseCaptureLlmResult(content);
}

export async function processCapture(
  userId: string,
  input: CaptureRequestBody,
): Promise<CaptureResponseBody> {
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
    messageType: "CAPTURE",
    content: JSON.stringify({
      text: input.text,
      ...(input.url ? { url: input.url } : {}),
      ...(input.title ? { title: input.title } : {}),
    }),
  });

  let extracted: CaptureLlmResult;
  try {
    extracted = await extractCapture(input);
  } catch {
    extracted = fallbackCaptureResult(input.text);
  }

  const task = insertTask({
    originId: origin.id,
    userId,
    chatId: userMessageId,
    kind: extracted.kind,
    title: extracted.title.trim(),
    dueAt: extracted.dueAt,
    summary: extracted.summary.trim(),
    body: input.text,
    sourceUrl: input.url ?? input.tabUrl,
    sourceTitle: input.title,
  });

  insertChat({
    id: ezerMessageId,
    originId: origin.id,
    role: "ezer",
    messageType: "TEXT",
    content: extracted.reply.trim(),
  });

  return {
    taskId: task.id,
    originId: origin.id,
    origin: origin.origin,
    item: {
      id: task.id,
      kind: task.kind,
      title: task.title,
      dueAt: task.dueAt,
      summary: task.summary,
    },
    reply: extracted.reply.trim(),
    userMessageId,
    ezerMessageId,
  };
}
