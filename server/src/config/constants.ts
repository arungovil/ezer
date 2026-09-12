export const defaultPort = 3000;
export const defaultDbPath = "./data/ezer.sqlite";

export const defaultLlmBaseUrl = "https://api.deepseek.com";
export const defaultLlmModel = "deepseek-chat";

export const routePaths = {
  health: "/health",
  user: "/user",
  chat: "/chat",
  captures: "/captures",
} as const;

export const errorMessages = {
  messageRequired: "message is required",
  chatRequired: "message and tabUrl are required",
  chatIdRequired: "chat id is required",
  chatNotFound: "Chat message not found",
  chatHasLinkedTask: "Cannot delete a capture message with a linked task",
  requestFailed: "Request failed",
  captureRequired: "text and tabUrl are required",
  tabUrlRequired: "tabUrl query parameter is required",
  invalidTabUrl: "tabUrl must be a valid page URL",
  userIdRequired: "X-Ezer-User-Id header must be a valid UUID",
  userNotFound: "User not found",
  userPersistFailed: "Failed to persist user",
  llmNotConfigured: "LLM is not configured. Set LLM_API_KEY in .env",
  llmFailed: "Failed to get a response from the language model",
} as const;
