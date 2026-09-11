import { getEnv } from "../config/env.js";
import { chatSystemPrompt } from "../prompts/chat.js";
import { type ChatLlmResult, isChatLlmResult } from "../types/chat.js";
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
