export const defaultPort = 3000;

export const defaultLlmBaseUrl = "https://api.deepseek.com";
export const defaultLlmModel = "deepseek-chat";

export const routePaths = {
  health: "/health",
  chat: "/chat",
  compile: "/api/compile",
} as const;

export const errorMessages = {
  messageRequired: "message is required",
  llmNotConfigured: "LLM is not configured. Set LLM_API_KEY in .env",
  llmFailed: "Failed to get a response from the language model",
  rawEventsRequired: "rawEvents must be an array",
} as const;
