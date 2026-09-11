import { defaultDbPath, defaultLlmBaseUrl, defaultLlmModel, defaultPort } from "./constants.js";

export interface Env {
  port: number;
  dbPath: string;
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
}

export function getEnv(): Env {
  return {
    port: Number(process.env.PORT ?? defaultPort),
    dbPath: process.env.DB_PATH?.trim() || defaultDbPath,
    llmApiKey: process.env.LLM_API_KEY?.trim() ?? "",
    llmBaseUrl: process.env.LLM_BASE_URL?.trim() || defaultLlmBaseUrl,
    llmModel: process.env.LLM_MODEL?.trim() || defaultLlmModel,
  };
}

export function isLlmConfigured(): boolean {
  return getEnv().llmApiKey.length > 0;
}
