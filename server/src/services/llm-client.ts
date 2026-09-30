import OpenAI from "openai";
import { getEnv } from "../config/env.ts";

let client: OpenAI | null = null;

export function getLlmClient(): OpenAI {
  if (client) {
    return client;
  }

  const { llmApiKey, llmBaseUrl } = getEnv();
  if (!llmApiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  client = new OpenAI({
    apiKey: llmApiKey,
    baseURL: llmBaseUrl,
  });

  return client;
}
