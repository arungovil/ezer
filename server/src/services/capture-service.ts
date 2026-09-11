import { randomUUID } from "node:crypto";
import { getEnv } from "../config/env.js";
import { insertCapture } from "../db/captures.js";
import { getOrCreateConversation } from "../db/conversations.js";
import { insertItem } from "../db/items.js";
import { insertMessage } from "../db/messages.js";
import { captureSystemPrompt } from "../prompts/capture.js";
import {
  type CaptureLlmResult,
  type CaptureRequestBody,
  type CaptureResponseBody,
  isCaptureLlmResult,
} from "../types/capture.js";
import { getLlmClient } from "./llm-client.js";

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
  const conversation = getOrCreateConversation(userId, input.tabUrl);
  const capture = insertCapture({
    conversationId: conversation.id,
    userId,
    rawText: input.text,
    sourceUrl: input.url ?? input.tabUrl,
    sourceTitle: input.title,
  });

  let extracted: CaptureLlmResult;
  try {
    extracted = await extractCapture(input);
  } catch {
    extracted = fallbackCaptureResult(input.text);
  }

  const item = insertItem({
    captureId: capture.id,
    userId,
    kind: extracted.kind,
    title: extracted.title.trim(),
    dueAt: extracted.dueAt,
    summary: extracted.summary.trim(),
  });

  const userMessageId = randomUUID();
  const ezerMessageId = randomUUID();

  insertMessage({
    id: userMessageId,
    conversationId: conversation.id,
    role: "user",
    messageType: "CAPTURE",
    content: JSON.stringify({
      text: input.text,
      ...(input.url ? { url: input.url } : {}),
      ...(input.title ? { title: input.title } : {}),
    }),
  });

  insertMessage({
    id: ezerMessageId,
    conversationId: conversation.id,
    role: "ezer",
    messageType: "TEXT",
    content: extracted.reply.trim(),
  });

  return {
    captureId: capture.id,
    conversationId: conversation.id,
    item: {
      id: item.id,
      kind: item.kind,
      title: item.title,
      dueAt: item.dueAt,
      summary: item.summary,
    },
    reply: extracted.reply.trim(),
    userMessageId,
    ezerMessageId,
  };
}
